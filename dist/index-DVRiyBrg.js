'use strict';

require('stream');

/**
 * Match commit with revert data
 * @param object - Commit object
 * @param source - Revert data
 * @returns `true` if commit matches revert data, otherwise `false`
 */
function isMatch(object, source) {
    let aValue;
    let bValue;
    for (const key in source) {
        aValue = object[key];
        bValue = source[key];
        if (typeof aValue === 'string') {
            aValue = aValue.trim();
        }
        if (typeof bValue === 'string') {
            bValue = bValue.trim();
        }
        if (aValue !== bValue) {
            return false;
        }
    }
    return true;
}
/**
 * Find revert commit in set
 * @param commit
 * @param reverts
 * @returns Revert commit if found, otherwise `null`
 */
function findRevertCommit(commit, reverts) {
    if (!reverts.size) {
        return null;
    }
    const rawCommit = commit.raw || commit;
    for (const revertCommit of reverts) {
        if (revertCommit.revert && isMatch(rawCommit, revertCommit.revert)) {
            return revertCommit;
        }
    }
    return null;
}

class RevertedCommitsFilter {
    hold = new Set();
    holdRevertsCount = 0;
    /**
     * Process commit to filter reverted commits
     * @param commit
     * @yields Commit
     */
    *process(commit) {
        const { hold } = this;
        const revertCommit = findRevertCommit(commit, hold);
        if (revertCommit) {
            hold.delete(revertCommit);
            this.holdRevertsCount--;
            return;
        }
        if (commit.revert) {
            hold.add(commit);
            this.holdRevertsCount++;
            return;
        }
        if (this.holdRevertsCount > 0) {
            hold.add(commit);
        }
        else {
            if (hold.size) {
                yield* hold;
                hold.clear();
            }
            yield commit;
        }
    }
    /**
     * Flush all held commits
     * @yields Held commits
     */
    *flush() {
        const { hold } = this;
        if (hold.size) {
            yield* hold;
            hold.clear();
        }
    }
}

/**
 * Filter reverted commits.
 * @param commits
 * @yields Commits without reverted commits.
 */
async function* filterRevertedCommits(commits) {
    const filter = new RevertedCommitsFilter();
    for await (const commit of commits) {
        yield* filter.process(commit);
    }
    yield* filter.flush();
}

exports.RevertedCommitsFilter = RevertedCommitsFilter;
exports.filterRevertedCommits = filterRevertedCommits;
//# sourceMappingURL=index-DVRiyBrg.js.map
