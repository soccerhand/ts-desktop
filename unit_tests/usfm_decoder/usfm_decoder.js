'use strict';

;(function () {

    let assert = require('assert');
    let fs = require('fs');

    function getDecoder () {
        let Decoder = require('../../src/js/lib/usfm_decoder/usfmTagDecoder').Decoder;
        let decoder = new Decoder();
        return decoder;
    }

    function getUsfm (filename) {
        return fs.readFileSync('./unit_tests/usfm_decoder/data/' + filename).toString();
    }

    describe('@UsfmDecoder', function () {
        describe('@DecodeChunk', function () {
            it('should decode all usfm markers', function () {

                let decoder = getDecoder();
                let usfm = getUsfm('smaller.usfm');

                let html = decoder.decode(usfm);

                console.log(usfm);
                console.log('--------------');
                console.log(html);

                assert(html.indexOf('\\v') === -1);

            });
        });
    });

})();
