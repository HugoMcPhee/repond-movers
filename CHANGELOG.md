TODO

- update mover2d to check distance and shouldKeepMoving speed, so it dosen't trigger from average speed at the start
- use position pool objects where copyPoint is used, (like for prevStepState & currentStepState)

v1.0.0

- uses new repond 1.0.1!

v0.11.3

- If the mover should stop moving, it wont keep animating, and also and also sets the mover value to the target value if it should stop moving
- updated to repond 0.17.4

v0.11.2

- updated to repond 0.14.2

v0.11.0

- updated to repond 0.13.0

v0.10.5

- updated to repond 0.12.0

v0.10.4

- uses better types with names for addMoverRules

v0.10.0

- use imports from repond
- dont need factory functions anymore!

v0.7.0

- added addMoverRules to automatically add mover rules for a mover

v0.6.1

- renamed to repond-movers

v0.6.0

- some updates to help with garbage collection by reusing objecs
- supports custom stop speeds to work with smaller or higher values (like 0.0 - 1.0)
- will stop moving is the movement speed is 0 or very close to 0 (hopefully wont have side effects for springs that slow and speedup again)

v0.5.7

- mover3d supports more precision when stopping

v0.5.5

- uses renamed chootils
- published as npm packge

v0.5.3

- include dist folder so installing's not needed

v0.5.0

- moving to be importable package :)

v0.4.3

- updated mover2d and mover3d to check lower value for the springs shouldKeepMoving speed

v0.4.2

- updated mover2d and mover3d to check shouldKeepMoving before the setState (like mover (1d) does)
- removed interpolate from mover to fix on iPad

v0.4.1

- updated mover2d and mover3d to use point inPlace mutable functions to avoid creating lots of objects in a physics step,
  which could cause garbage collection stuttering

v0.4.0

- added moverMulti to allow a single mover with multiple values (useful for animation weights, or styles)
- removoed some eslint warnings

v0.3.1

- added initialState for moverState

v0.3.01

- cleaning up a little bit, and changing MoveMode to have "push" and "drag"

v0.3.0

- adding auto property making scripts with typescript 4.1 dynamic names

v0.2.0

- changes stateland 'scraps' to concepto 'refs'

v0.1.2

- added safer update position to mover2d (that was in mover3d)

v0.1.1

- more optional states and simplified some places
