'use strict';

;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let fs = require('fs');
    let path = require('path');

    let Git = require("nodegit");

    let repoPath = './unit_tests/nodegit/repo/';
    let testFileDir = './unit_tests/nodegit/files/';
    //let repoUrl = "https://github.com/soccerhand/teset";
    let repoUrlSsh = "git@github.com:soccerhand/teset.git";

    let sshPublicKey = "/root/.ssh/id_rsa.pub";
    let sshPrivateKey = "/root/.ssh/id_rsa";

    /*
    let Configurator = require('../../app/js/configurator').Configurator;
    let configurator = new Configurator();
    let config = require('../../app/config/defaults');
    configurator.setStorage({});
    configurator.loadConfig(config);
    */

    describe('@Nodegit', function () {

        before(function (done) {
            let config;
            rimraf(repoPath, function () {
                Git.Config.openDefault()
                    .then(function(configResult) {
                        config = configResult;
                        return config.setString("user.name", "soccerhand");
                    }).then(function() {
                        return config.setString("user.email", "soccerhand@gmail.com");
                    }).then(function() {
                        done();
                    });
            });
        });

        after(function (done) {
            rimraf(repoPath, function () {
                done();
            });
        });


        describe('@CloneRepo', function () {
            this.timeout(15000);

            let success = false;

            let repo;

            before(function (done) {
                var opts = {
                  fetchOpts: {
                    callbacks: {
                      certificateCheck: function() {
                        return 1;
                      },
                      credentials: function(url, userName) {
                        return Git.Cred.sshKeyNew(
                          userName,
                          sshPublicKey,
                          sshPrivateKey,
                          "");
                      }
                    }
                  }
                };

                Git.Clone(repoUrlSsh, repoPath, opts)
                    .then(function () {
                        success = true;
                        done();
                    })
                    .catch(function (err) {
                        success = false;
                        done(err);
                    });
            });

            it('should copy down README.md', function () {
                assert(success);

                let stats = fs.statSync(repoPath + '/README.md');
                assert(stats.isFile());
            });
        });

        describe('@OpenRepo', function () {
            let success = false;
            let message = null;

            before(function (done) {
                let getMostRecentCommit = function(repository) {
                  return repository.getBranchCommit("master");
                };

                let getCommitMessage = function(commit) {
                  return commit.message();
                };

                Git.Repository.open(repoPath)
                    .then(getMostRecentCommit)
                    .then(getCommitMessage)
                    .then(function(msg) {
                        console.log("latest commit: " + msg);
                        success = true;
                        message = msg;
                        done();
                    }).catch(function (err) {
                        success = false;
                        done(err);
                    });
            });

            it('should read latest commit', function () {
                assert(success);
            });

        });

        describe('@AddFile', function () {
            let success = false;
            let fileName = 'hello.txt'

            before(function (done) {
                let repo, index, oid;
                Git.Repository.open(repoPath)
                    .then(function(repoResult) {
                        repo = repoResult;

                        // Write new file to repo directory
                        fs.createReadStream(path.join(testFileDir, fileName)).pipe(fs.createWriteStream(path.join(repo.workdir(), fileName)));

                        return repo.openIndex();
                    }).then(function(indexResult) {
                      index = indexResult;
                      return index.read(1);
                    }).then(function() {
                      // can use a relative path if using addByPath
                      return index.addAll();
                    }).then(function() {
                      return index.updateAll();
                    }).then(function() {
                      // this will write the file to the index
                      return index.write();
                    }).then(function() {
                      return index.writeTree();
                    }).then(function(oidResult) {
                      oid = oidResult;
                      return Git.Reference.nameToId(repo, "HEAD");
                    }).then(function(head) {
                      return repo.getCommit(head);
                    }).then(function(parent) {
                      var author = Git.Signature.now("soccerhand", "soccerhand@gmail.com");
                      var committer = Git.Signature.now("soccerhand", "soccerhand@github.com");

                      return repo.createCommit("HEAD", author, committer, "unit testing", oid, [parent]);
                    }).then(function(commitId) {
                      console.log("New Commit: ", commitId);

                        let commit = Git.Commit.lookup(repo, commitId)
                            .then(function (commit) {
                                return commit.getDiff()
                            }).then(function(arrayDiff) {
                                arrayDiff.forEach(function(diff) {
                                    let deltas = diff.numDeltas();
                                    console.log('diff, deltas: ' + deltas);
                                    if (deltas > 0) {
                                        console.log(diff.getDelta(0).newFile().path());
                                    }
                                });
                                success = true;
                                done();
                            });


                    }).catch(function (err) {
                        success = false;
                        done(err);
                    });
            });

            it('should add a file', function () {
                assert(success);

                let stats = fs.statSync(path.join(repoPath, fileName));
                assert(stats.isFile());
            });

        });

/*
        describe('@Push', function () {
            this.timeout(15000);

            let success = false;

            before(function (done) {
                let repo, remote;

                Git.Repository.open(repoPath)
                    .then(function(repoResult) {
                        repo = repoResult;
                        return repoResult.openIndex();
                    }).then(function() {
                        return repo.getRemote("origin");
                    }).then(function(remoteResult) {
                      console.log('remote Loaded');
                      remote = remoteResult;

                        var opts = {
                            callbacks: {
                              certificateCheck: function() {
                                return 1;
                              },
                              credentials: function(url, userName) {
                                return Git.Cred.sshKeyNew(
                                  userName,
                                  sshPublicKey,
                                  sshPrivateKey,
                                  "");
                              }
                            }
                        };


                      return remote.push(["refs/heads/master:refs/heads/master"], opts);
                    }).then(function() {
                      console.log('remote Pushed!')
                      success = true;
                      done();
                    }).catch(function(err) {
                        success = false;
                        done(err);
                    })
            });

            it('should push to origin', function () {
                assert(success);
            });

        });

*/

        describe('@ReadConfig', function () {
            let value;

            before(function (done) {
                Git.Config.openDefault()
                    .then(function(config) {
                        return config.getStringBuf("user.email");
                    }).then(function(buf) {
                        value = buf.toString();
                        done();
                    });
            });

            it('should read the user\'s email address', function () {
                assert(true);
                console.log('config email = ' + value);
            });

        });



    });

})();
