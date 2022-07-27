"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTag = exports.checkCommitHash = void 0;
const child_process_1 = require("child_process");
const logger_1 = require("./logger");
let commitHash;
function checkCommitHash() {
    return new Promise((resolve) => {
        if (commitHash) {
            return resolve(commitHash);
        }
        try {
            (0, child_process_1.exec)(`git log -1 --pretty=format:%h`, { timeout: 999 }, (error, stdout) => {
                if (stdout) {
                    commitHash = stdout.trim();
                    return resolve(commitHash);
                }
                else {
                    resolve('');
                }
            });
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
            resolve('');
        }
    });
}
exports.checkCommitHash = checkCommitHash;
let tag;
function checkTag() {
    return new Promise((resolve) => {
        if (tag) {
            return resolve(tag);
        }
        try {
            (0, child_process_1.exec)(`git describe --abbrev=0 --tags`, { timeout: 999 }, (error, stdout) => {
                if (stdout) {
                    tag = stdout.trim();
                    return resolve(tag);
                }
                else {
                    resolve('');
                }
            });
        }
        catch (e) {
            logger_1.sphinxLogger.error(e);
            resolve('');
        }
    });
}
exports.checkTag = checkTag;
//# sourceMappingURL=gitinfo.js.map