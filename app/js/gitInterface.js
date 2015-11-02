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
         * @returns Promise the repository object
         */
        clone: function (remoteUrl, path) {
            let repo;

            return null;
        },

        /**
         * Adds and commits all new/changed/deleted files in the specified repository
         * @param path the path to the local repository
         * @param username username of the author
         * @param email email address of the author
         * @returns boolean true if the changes were successfully added and committed
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

                    return Git.Reference.lookup(repo, "HEAD");
                })
                .then(function (ref) {
                    let target = ref.target();
                    if (target === undefined) {
                        return [];
                    }
                    else {
                        return [repo.getCommit(target)];
                    }

                })
                .then(function(parents) {
                    let author = Git.Signature.now(username, email);
                    let committer = Git.Signature.now(username, email);

                    return repo.createCommit("HEAD", author, committer, "auto save", oid, parents);
                })
                .then(function(commitId) {
                    return commitId;

                });
        },

        /**
         * Pushes all pending commits in the specified local repository to the configured remote
         * @param path the path to the local repository
         * @returns boolean true if the push was successful
         */
        push: function (path) {
            return false;
        },

        /**
         * Reverts all new/changed/deleted files in the specififed repository
         * @param path the path to the local repository
         * @returns boolean true if the changes were successfully reverted
         */
        discard: function (path) {
            return false;
        }

    };

    exports.init = gitInterface.init;
    exports.clone = gitInterface.clone;
    exports.stage = gitInterface.stage;
    exports.push = gitInterface.push;
    exports.discard = gitInterface.discard;
})();
