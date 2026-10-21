# Football Strategy 1.0.0 · rules and interpretations

## The contest

The grid has 9 columns and 12 rows, indexed internally from 0. Offense attacks row 0 from the bottom; defensive returns attack row 11. Every player has equal movement and abilities.

Offense starts at (2,10), (4,10), (6,10); the center QB holds the ball. Defense starts at (2,1), (4,1), (6,1). Formation resets each possession. Possession alternates after every offensive TD, interception, strip or eighth-down expiration. Players retain their positions between downs; blocks release.

Each coach gets three scheduled offensive possessions, alternating A/B/A/B/A/B. One down is three planned turns; a possession has eight downs, up to 24 turns. There are no first downs. TDs score 7. Defensive TDs are bonuses and do not consume the scoring team's scheduled offensive possession. A winner is checked only after both sides have used their scheduled opportunities. A tie adds one possession each, then repeats paired overtime rounds as necessary.

## Planning

Each player has one instruction per turn: up, down, left, right, hold or (for a current carrier) pass. Movement is exactly one cardinal square and clamps at the field boundary. Unassigned or invalidated instructions hold. Later projected positions reflect only your own plan and same-team destination cancellation; they cannot predict opposing contact. An instruction names a direction, not an absolute destination, so if earlier contact changed a player's position, later legal instructions apply from the actual position.

Tap a player, then an adjacent highlighted square. To pass, select the projected carrier, enter Pass mode and tap a teammate. Turn tabs, undo and clearing are available until submission. The final review locks all three turns. The stored draft and its review bind to the exact game, possession, down and revision. An old review cannot submit a newer down.

## Turn sequence

1. Determine whether the current carrier has a legal unused throw and a teammate target. A valid attempted throw consumes this down's single throw, even if the thrower is stripped before flight. A blocked carrier cannot initiate a throw.
2. If passing, hold the thrower and intended receiver at their beginning-of-turn squares. All defenders and other offensive players execute their instructions. Without a pass, everyone executes movement together.
3. Resolve simultaneous destination conflicts and contact. A strip of the thrower ends the play before any ball flight.
4. Throw toward the receiver's beginning-of-turn square. A defender on the pass path intercepts. Otherwise the receiver receives the ball without a random accuracy or drop roll.
5. On completion, only the receiver executes their previously programmed instruction for that turn. A blocked receiver still catches but cannot move. Resolve contact again. A receiver action that is itself Pass does not cause a second throw.
6. Resolve scoring, then look for a guaranteed offensive breakaway within the remaining possession turns. Contact always takes precedence over a score on the same turn.

Any carrier may throw if this down's throw is unused. An invalid pass instruction (wrong carrier/target, already used, or blocked) becomes hold. Throws reset at the next down.

## Ball path: supercover

Passes are drawn as straight lines between square centers. The interception path contains all grid squares the segment touches after leaving the thrower's square, including the receiver's square. A diagonal that goes exactly through a corner includes **both side squares and the diagonal square** at that point. The visible gold preview uses this exact same calculation. Adjacent squares outside the visible path do not intercept.

Defenders move before ball flight. The preview shows current visible defense, not its hidden future movement. Along the path, the first defender encountered intercepts. If defenders occupy two squares touched at precisely the same corner/time, the defender with the lowest number (D1 before D2 before D3) wins the tie. These identifiers have equal abilities; numbering is only a deterministic simultaneous-event tiebreak.

## Simultaneous movement and contact

Resolution does not process one coach first.

- Same-team players selecting the same destination both have their moves cancelled, including a stationary teammate. Repeat cancellation as needed when a cancelled move leaves an occupied square. Same-team swaps and following into vacated squares are allowed.
- Then detect all opposing shared destinations and exact swaps as a set. Passing through another player on a swap counts as contact. Following an opponent into a vacated square without an exact swap does not count.
- On opposing contact, both pieces retain their starting squares. No players stack. Cancelled contact moves can create additional conflicts, so resolve cancellations/contact to a fixed point. There are only six players and every cancellation reverts a move, so this terminates.
- If the offensive ball carrier participates in opposing contact, the defender strips the ball. The ball transfers to that defender at the defender's retained square. If several strips are detected during contact closure, the lowest numbered defender is credited.
- Non-carrier offensive contact blocks both pieces for the remaining turns of that down. This applies regardless of who initiated contact. Several simultaneous contacts may block several pieces. A simultaneous strip has priority over a block involving that defender; another blocker cannot erase contact already made with the carrier.
- On a new down, all blocks clear. Contacting pieces stayed in separate squares, so simply holding next to each other never re-blocks them. They must enter/contact the same square or swap again.
- A blocked defender occupies its square and can intercept. It strips a carrier moving into it. A blocked receiver may be targeted and catch, then holds. A defender moving toward a held receiver creates a block during the first phase; because pieces retain separate starting squares, the defender may end up outside the receiver square and the pass can still complete if no defender lies on the actual flight path.
- When a blocker and defender meet while another defender reaches the carrier, both contact events resolve together and the strip ends the possession.

## Guaranteed touchdowns

A time-expanded cardinal search finds a route to the correct end-zone row. At each route step, it rejects squares opponents could reach by that time and conservatively rejects edges when an opponent could reach the runner's previous square in that time. This also excludes possible opposing swaps/cutoffs. Every opponent is treated as a free chaser, even if currently blocked; teammate assistance is ignored. This deliberate conservative certificate may decline to accelerate some real breakaways, but never awards one solely because a runner looks ahead.

An offensive route must fit all possession turns remaining after the current turn. Reaching row 0 normally still scores immediately. On a defensive takeaway, the same safe-route calculation targets row 11 without an offensive turn budget. A certified return is animated quickly and earns 7; otherwise the offensive possession ends immediately with no extra return planning. There is no random return outcome.

## Replay, history and network behavior

Each resolved down has an immutable replay with the starting state, ordered animation events and resulting state. Replays never recalculate or apply points. Skipping a replay displays its recorded end state. Coaches may catch up on earlier downs before planning the newest one; an arriving down does not interrupt a running replay.

Both coaches commit plans in separate immutable documents. The other coach cannot read a plan until both are committed or the round has an archived replay. A Firestore transaction advances a specific revision once, writes that revision's replay, clears submitted status and persists the next state. Conflicting resolvers retry and see that the old revision is already done. If a concurrent write is reported as a rules denial before the normal SDK retry, the client re-reads the game and retries only if its canonical fingerprint changed; an unchanged-state rules denial is surfaced. Resolved plans are never reused for a newer round.

Records derive from one immutable canonical completed-game result per room; refresh cannot increment totals. Forfeits retain actual scores/stats but give the other coach the win even if that coach was trailing. Cancelled unjoined rooms never count. Practice records never enter the friend leaderboard.

The client/server access rules assume friendly participants. Participants cannot modify other matches or immutable submissions; rules do not reproduce the full gameplay engine server-side. No custom server is required.
