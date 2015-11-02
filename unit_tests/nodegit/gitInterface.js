'use strict';

;(function () {

    let assert = require('assert');
    let rimraf = require('rimraf');
    let fs = require('fs');
    let path = require('path');

    let git = require('../../app/js/gitInterface');

    let repoPath = './unit_tests/nodegit/repo/';
    let testFileDir = './unit_tests/nodegit/files/';
    let repoUrl = "https://github.com/soccerhand/teset";
    //let repoUrlSsh = "git@github.com:soccerhand/teset.git";

    let sshPublicKey = "/root/.ssh/id_rsa.pub";
    let sshPrivateKey = "/root/.ssh/id_rsa";

    describe('@GitInterface', function () {

        before(function (done) {
            rimraf(repoPath, function () {
                done();
            });
        });

        after(function (done) {
            rimraf(repoPath, function () {
                done();
            });
        });


        let repo;

        describe('@InitializeRepo', function () {
            let success = false;

            before(function (done) {
                git.init(repoPath, repoUrl)
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

        describe('@AddFile', function () {
            let success = false;
            let fileName = "hello.txt";

            before(function (done) {
                fs.createReadStream(path.join(testFileDir, fileName)).pipe(fs.createWriteStream(path.join(repo.workdir(), fileName)));

                git.stage(repo.workdir(), "psh", "soccerhand@gmail.com")
                    .then(function (commitId) {
                        success = true;
                        done();
                    })
                    .catch(function (err) {
                        success = false;
                        done(err);
                    });
            });

            it('should add 1 file to the index', function (done) {
                assert(success);

                repo.openIndex()
                    .then(function (index) {
                        assert.equal(index.entries().length, 1);
                        done();
                    })
            });

        });



    });

})();
