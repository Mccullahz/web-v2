## Three.js Plan

- As I have begun to switch mental models on what I want this portfolio to look like I think I have settled upon a singular idea.
- I want to create a 3D interactive mug that is dropped on initial view. The pieces will break apart on the ground and the user can rotate around the scene to view the broken mug from different angles. On each piece of the mug there will be metadata about a project I have done in the past. The user can click on each piece to view more information about that project.

- The following table breaks down the all the tasks I believe are necessary to complete this project and where I will be completing each task. Keeping this approach will keep me organized and avoid scope creep as well as overcomplicating Three.js implementation.

- Blender background with hdri lighting to match (close enough atleast) the tailwind bg color is: #D9FDFFFF


-----------------------------
|  Task         | 	Where   |
-----------------------------
|  Mug model    |	Blender |
|  Mug fracture	|   Blender |(Cell Fracture)
|  Break anim   |	Blender |
|  init camera  |	Blender |
|  Time split   |	Blender |
|  Interact     |   Three   |
|  effects      |	Three   |
|  Camera focus |	Three   |
| metadata(proj)|	React   |
-----------------------------
-----------------------------------------------------------

- This plan is in place and is implemented pretty well so far. After discussing this and showcasing it to a few different people, I realized this is not exactly intuitive for the user. This was a thought, but after seeing it in action it is not as clear as I thought it would seem.

- To better communicate the idea of the interactivity, we need to implement tool tips. general CSS style tool tips are not the best for this, I would rather stick with the 3D side of things and use a mouse + jk + ad / up down 3d tool tip. I know I have seen these kinds of tips implemented but have no idea how the devs are doing so.

- Research if there are libraries or even examples of 3d tips and figure out how they generally are wired up. I could probably make them in blender, but not sure if this is the right approach. Check bakc later.


- Also, ideally we can make it so we dont have to use the mouse at all and just use the kb to navigate. this is close already, but enter and or space are not wired to interact the same way that a click is. TODO: make enter and or space trigger onClick



