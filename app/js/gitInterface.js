// git interface module

;(function () {
    'use strict';

    let Git = require("nodegit");

    let gitInterface = {
        /**
         * Initializes a local git repository with one remote configured
         * @param path the local path to initialize the repository in
         * @param remoteUrl the remote URL to add to the repository
         * @param remoteName optional, the name of the remote to add to the repository (defaults to "origin")
         * @returns Promise the initialized repository object
         */
        init: function (path, remoteUrl, remoteName) {
            let repo;
            let isBare = 0;

            remoteName = remoteName || "origin";

            return Git.Repository.init(path, isBare)
                .then(function (repoResult) {
                    repo = repoResult;
                    Git.Remote.create(repo, remoteName, remoteUrl);
                    return repo;
                });
        },

        /**
         * Clones a remote repository into the specified local path
         * @param remoteUrl the remote URL of the repository to clone
         * @param path the local path to clone the repository into
         * @param keys struct containing publicKeyPath and privateKeyPath
         * @returns Promise the repository object
         */
        clone: function (remoteUrl, path, keys) {
            let repo;

            let opts = {
                fetchOpts: {
                    callbacks: {
                        certificateCheck: function () {
                            return 1;
                        },
                        credentials: function (url, userName) {
                            return Git.Cred.sshKeyNew(
                                userName,
                                keys.publicKeyPath,
                                keys.privateKeyPath,
                                ""
                            );
                        }
                    }
                }
            };

            return Git.Clone(remoteUrl, path, opts);
        },

        /**
         * Adds and commits all new/changed/deleted files in the specified repository
         * @param path the path to the local repository
         * @param username username of the author
         * @param email email address of the author
         * @returns Promise the Oid of the commit
         */
        stage: function (path, username, email) {
            let repo, index, oid;

            return Git.Repository.open(path)
                .then(function(repoResult) {
                    repo = repoResult;
                    return repo.openIndex();
                })
                .then(function(indexResult) {
                    index = indexResult;
                    return index.read(1);
                })
                .then(function() {
                    // Get all added files
                    return index.addAll();
                })
                .then(function() {
                    // Get all changed/deleted files
                    return index.updateAll();
                })
                .then(function() {
                    return index.write();
                })
                .then(function() {
                    return index.writeTree();
                })
                .then(function(oidResult) {
                    oid = oidResult;

                    return repo.getHeadCommit();
                })
                .then(function(head) {
                    let parents = head !== null ? [head] : [];

                    let author = Git.Signature.now(username, email);
                    let committer = Git.Signature.now(username, email);

                    return repo.createCommit("HEAD", author, committer, "auto save", oid, parents);
                })
                .then(function(commitId) {
                    return commitId;

                });
        },

        /**
         * Fetches latest commits from the origin and merges into local branch
         * @param path the path to the local repository
         * @param keys struct containing publicKeyPath and privateKeyPath
         * @returns Promise a commit id for a succesful merge or an index for a merge with conflicts
         */
        pull: function (path, keys) {
            let repo;

            return Git.Repository.open(path)
                .then(function(repoResult) {
                    repo = repoResult;

                    let opts = {
                        callbacks: {
                            certificateCheck: function () {
                                return 1;
                            },
                            credentials: function (url, userName) {
                                return Git.Cred.sshKeyNew(
                                    userName,
                                    keys.publicKeyPath,
                                    keys.privateKeyPath,
                                    ""
                                );
                            }
                        }
                    };

                    return repo.fetch("origin", opts);
                })
                .then(function (number) {
                    return repo.mergeBranches("master", "origin/master");
                });
        },

        /**
         * Pushes all pending commits in the specified local repository to the origin
         * @param path the path to the local repository
         * @param keys struct containing publicKeyPath and privateKeyPath
         * @returns Promise numeric error code
         */
        push: function (path, keys) {
            let repo;

            return Git.Repository.open(path)
                .then(function(repoResult) {
                    repo = repoResult;
                    return repo.openIndex();
                }).then(function() {
                    return repo.getRemote("origin");
                }).then(function(remote) {
                    let opts = {
                        callbacks: {
                            certificateCheck: function () {
                                return 1;
                            },
                            credentials: function (url, userName) {
                                return Git.Cred.sshKeyNew(
                                    userName,
                                    keys.publicKeyPath,
                                    keys.privateKeyPath,
                                    ""
                                );
                            }
                        }
                    };

                    return remote.push(["refs/heads/master:refs/heads/master"], opts);
                });
        }

    };

    exports.init = gitInterface.init;
    exports.clone = gitInterface.clone;
    exports.stage = gitInterface.stage;
    exports.pull = gitInterface.pull;
    exports.push = gitInterface.push;
})();
