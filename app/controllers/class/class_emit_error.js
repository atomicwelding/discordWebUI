'use strict';
/**
 * Simple class to send an error
 * @param {STRING} code 
 * @param {STRING} reason 
 */
module.exports.emitError = function(state, reason) {
    this.state = state;
    this.reason = reason;

    // stringify before sending
    this.toSent = function () {
        let toJSON = {
            state: this.state,
            reason: this.reason
        }
        return JSON.stringify(toJSON);
    };
};