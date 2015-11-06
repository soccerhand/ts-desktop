'use strict';

;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let fs = require('fs');
    let path = require('path');

    let git = require('../../app/js/gitInterface');

    let repoPathNew = './unit_tests/nodegit/repoNew/';
    let repoPathClone = './unit_tests/nodegit/repoClone/';
    let repoPathOther = './unit_tests/nodegit/repoOther/';
    let testFileDir = './unit_tests/nodegit/files/';
    let repoUrl = "git@github.com:soccerhand/teset.git";

    let keys = {
        'publicKeyPath': "/root/.ssh/id_rsa.pub",
        'privateKeyPath': "/root/.ssh/id_rsa"
    };

    describe('@GitInterface', function () {

        describe('@NewRepository', function () {

            before(function (done) {
                rimraf(repoPathNew, function () {
                    done();
                });
            });

            after(function (done) {
                rimraf(repoPathNew, function () {
                    done();
                });
            });


            let repo;

            describe('@InitializeRepo', function () {
                let success = false;

                before(function (done) {
                    git.init(repoPathNew, repoUrl)
                        .then(function (repoResult) {
                            repo = repoResult;
                            success = true;
                            done();
                        })
                        .catch(function (err) {
                            success = false;
                            done(err);
                        });
                });

                it('should create repository directory', function () {
                    assert(success);

                    let stats = fs.statSync(repo.path());
                    assert(stats.isDirectory());
                });

                it('should configure the origin remote', function (done) {
                    assert(success);

                    repo.getRemote("origin")
                        .then(function (remote) {
                            assert.equal(remote.url(), repoUrl);
                            done();
                        });
                });

            });

            describe('@StageFile', function () {
                let success = false;
                let fileName = "hello.txt";
                let oid;

                before(function (done) {
                    fs.createReadStream(path.join(testFileDir, fileName)).pipe(fs.createWriteStream(path.join(repo.workdir(), fileName)));

                    git.stage(repo.workdir(), "psh", "soccerhand@gmail.com")
                        .then(function (commitId) {
                            oid = commitId;
                            success = true;
                            done();
                        })
                        .catch(function (err) {
                            success = false;
                            done(err);
                        });
                });

                it('should add 1 file and advance the head', function (done) {
                    assert(success);

                    repo.getHeadCommit()
                        .then(function (head) {
                            assert(head.id().equal(oid));
                            done();
                        })
                });

            });

            describe('@StageAnotherFile', function () {
                let success = false;
                let fileName = "hello2.txt";
                let oid;

                before(function (done) {
                    fs.createReadStream(path.join(testFileDir, fileName)).pipe(fs.createWriteStream(path.join(repo.workdir(), fileName)));

                    git.stage(repo.workdir(), "psh", "soccerhand@gmail.com")
                        .then(function (commitId) {
                            oid = commitId;
                            success = true;
                            done();
                        })
                        .catch(function (err) {
                            success = false;
                            done(err);
                        });
                });

                it('should add 1 more file and advance the head', function (done) {
                    assert(success);

                    repo.getHeadCommit()
                        .then(function (head) {
                            assert(head.id().equal(oid));
                            done();
                        })
                });

            });

        });

        describe('@ClonedRepository', function () {

            before(function (done) {
                rimraf(repoPathClone, function () {
                    done();
                });
            });

            after(function (done) {
                rimraf(repoPathClone, function () {
                    done();
                });
            });

            let repo;

            describe('@Clone', function () {
                this.timeout(5 * 1000);

                let success = false;

                before(function (done) {
                    git.clone(repoUrl, repoPathClone, keys)
                        .then(function (repoResult) {
                            repo = repoResult;
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

                    let stats = fs.statSync(repoPathClone + '/README.md');
                    assert(stats.isFile());
                });

                it('should read the remote\'s last commit', function (done) {
                    assert(success);

                    repo.getReferenceCommit("refs/remotes/origin/master")
                        .then(function (commit) {
                            assert.equal(commit.id().tostrS().length, 40);
                            done();
                        })
                });


            });

            describe('@Pull', function () {
                this.timeout(5 * 1000);

                let success = false;
                let fileName = "hello2.txt";
                let repoOther;

                before(function (done) {
                    rimraf(repoPathOther, function () {
                        done();
                    });
                });

                before(function (done) {
                    // Clone the remote repo into a different local path for the purpose of pushing an update that our main local repo won't know about
                    git.clone(repoUrl, repoPathOther, keys)
                        .then(function (repoResult) {
                            repoOther = repoResult;

                            fs.createReadStream(path.join(testFileDir, fileName)).pipe(fs.createWriteStream(path.join(repo.workdir(), fileName)));

                            return git.stage(repoOther.workdir(), "somedude", "soccerhand@gmail.com");
                        })
                        .then(function () {
                            return git.push(repoOther.workdir(), keys);
                        })
                        .then(function () {
                            // Now pull the update into our main local repo
                            return git.pull(repo.workdir(), keys)
                        })
                        .then(function (mergeResult) {
                            success = true;
                            done();
                        })
                        .catch(function (err) {
                            success = false;
                            done(err);
                        });
                });

                it('should fetch from remote and merge into local branch', function () {
                    assert(success);
                });

                after(function (done) {
                    rimraf(repoPathOther, function () {
                        done();
                    });
                });


            });

            describe('@Push', function () {
                this.timeout(5 * 1000);

                let success = false;

                before(function (done) {
                    git.push(repo.workdir(), keys)
                        .then(function () {
                            success = true;
                            done();
                        })
                        .catch(function (err) {
                            success = false;
                            done(err);
                        });
                });

                it('should push to remote', function () {
                    assert(success);
                });

            });

            /*describe('@CheckRef', function () {
                this.timeout(5 * 1000);

                let success = false;

                it('should show some infoz', function (done) {
                    repo.getRemote("origin")
                        .then(function (remote) {
                            let ref = remote.getRefspec(0);
                            console.log('remote source: ' + ref.src());
                            console.log('remote dest : ' + ref.dst());

                            return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
                        })
                        .then(function (names) {
                            console.log('names: ' + names);
                            return repo.getReferenceCommit("refs/remotes/origin/master");
                        })
                        .then(function (commit) {
                            console.log(commit.id());
                            done();
                        });
                });

            });/**/

        });
    });

})();
