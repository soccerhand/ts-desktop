'use strict';

;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let fs = require('fs');
    let path = require('path');

    let Git = require("nodegit");

    let repoPath = './unit_tests/nodegit/repo/';
    let repoPath2 = './unit_tests/nodegit/repo2/';
    let testFileDir = './unit_tests/nodegit/files/';
    let repoUrl = "https://github.com/soccerhand/teset";
    //let repoUrl = "soccerhand@github.com:soccerhand/teset";

    /*
    let Configurator = require('../../app/js/configurator').Configurator;
    let configurator = new Configurator();
    let config = require('../../app/config/defaults');
    configurator.setStorage({});
    configurator.loadConfig(config);
    */

    describe('@Nodegit', function () {

        before(function (done) {
            rimraf(repoPath, function () {
                rimraf(repoPath2, function () {
                    done();
                });
            });
        });

        after(function (done) {
            rimraf(repoPath, function () {
                rimraf(repoPath2, function () {
                    done();
                });
            });
        });

        //describe('@Utils', function () {


            describe('@CloneRepo', function () {
                let success = false;

                before(function (done) {
                    Git.Clone(repoUrl, repoPath)
                    .then(function () {
                        success = true;
                        done();
                    })
                    .catch(function (err) {
                        success = false;
                        done(err);
                    });
                });

                it('shouldn\'t blowup', function () {
                    assert(success);
                });
            });

            describe('@InitializeRepo', function () {
                let success = false;

                before(function (done) {
                    let isBare = 0;
                    Git.Repository.init(repoPath2, isBare)
                    .then(function (repo) {
                        success = true;
                        done();
                    })
                    .catch(function (err) {
                        success = false;
                        done(err);
                    });
                });

                it('should create .git directory', function () {
                    assert(success);

                    let stats = fs.statSync(repoPath2 + '/.git/');
                    assert(stats.isDirectory());
                });

            });

            describe('@AddFile', function () {
                let success = false;
                let fileName = 'hello.txt'

                before(function (done) {
                    Git.Repository.open(repoPath)
                    .then(function(repo) {
                        let index, oid;

                        // Write new file to repo directory
                        fs.createReadStream(path.join(testFileDir, fileName)).pipe(fs.createWriteStream(path.join(repo.workdir(), fileName)));

                        repo.openIndex()
                        .then(function(indexResult) {
                          index = indexResult;
                          return index.read(1);
                        })
                        .then(function() {
                          // this file is in the root of the directory and doesn't need a full path
                          return index.addByPath(fileName);
                        })
                        .then(function() {
                          // this file is in a subdirectory and can use a relative path
                          return index.addByPath(fileName);
                        })
                        .then(function() {
                          // this will write the file to the index
                          return index.write();
                        })
                        .then(function() {
                          return index.writeTree();
                        })
                        .then(function(oidResult) {
                          oid = oidResult;
                          return Git.Reference.nameToId(repo, "HEAD");
                        })
                        .then(function(head) {
                          return repo.getCommit(head);
                        })
                        .then(function(parent) {
                          var author = Git.Signature.now("Nathan", "soccerhand@gmail.com");
                          var committer = Git.Signature.now("Nathan", "soccerhand@github.com");

                          return repo.createCommit("HEAD", author, committer, "unit testing", oid, [parent]);
                        })
                        .done(function(commitId) {
                          console.log("New Commit: ", commitId);
                        });


                        success = true;
                        done();
                    }).catch(function (err) {
                        success = false;
                        done(err);
                    });
                });

                it('shouldn\'t blowup', function () {
                    assert(success);
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
                        success = true;
                        message = msg;
                        done();
                    }).catch(function (err) {
                        success = false;
                        done(err);
                    });
                });

                it('shouldn\'t blowup', function () {
                    assert(success);
                    assert.equal('Initial commit\n', message);
                });

            });

        //});

    });

})();
