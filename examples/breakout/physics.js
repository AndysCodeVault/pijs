let g_physics = {
    "fn": {}
};

g_physics.fn.detectCollisionSide = function detectCollisionSide( circle, rectangle ) {
    // Find the closest point on the rectangle to the circle's center
    let closestX = g_physics.fn.clamp( circle.x, rectangle.x, rectangle.x + rectangle.width );
    let closestY = g_physics.fn.clamp( circle.y, rectangle.y, rectangle.y + rectangle.height );

    // Calculate the distance between the circle's center and the closest point
    let distanceX = circle.x - closestX;
    let distanceY = circle.y - closestY;
    let distance = Math.sqrt( distanceX * distanceX + distanceY * distanceY );

    // Check if the distance is less than or equal to the circle's radius
    if (distance <= circle.radius) {
        if( circle.y < rectangle.y + circle.dy ) {
            return "top";
        } else if( circle.x < rectangle.x + circle.dx ) {
            return "left"
        } else if( circle.x > rectangle.x + rectangle.width - circle.dx ) {
            return "right";
        } else {
            return "bottom";
        }
    } else {
        return false;
    }
}

g_physics.fn.resolveCollision = function resolveCollision(circle, rectangle) {
    // Calculate the center of the circle
    //const circleCenterX = circle.x2 + circle.radius;
    //const circleCenterY = circle.y2 + circle.radius;
    const circleCenterX = circle.x;
    const circleCenterY = circle.y;
   
    // Calculate the closest point on the rectangle to the circle
    let closestX = g_physics.fn.clamp(circleCenterX, rectangle.x, rectangle.x + rectangle.width);
    let closestY = g_physics.fn.clamp(circleCenterY, rectangle.y, rectangle.y + rectangle.height);

    // Calculate the distance between the circle's center and the closest point
    const distanceX = circleCenterX - closestX;
    const distanceY = circleCenterY - closestY;

    // Calculate the distance between the circle's center and the closest point
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

    // If the circle is already outside the rectangle, no need to resolve the collision
    if (distance > circle.radius) {
        return;
    }

    // Calculate the overlap distance
    const overlap = circle.radius - distance;

    // Calculate the normalized vector from the closest point to the circle's center
    const normalX = distanceX / distance;
    const normalY = distanceY / distance;

    // Move the circle outside the rectangle by the overlap distance
    circle.x += overlap * normalX;
    circle.y += overlap * normalY;
}

g_physics.fn.clamp = function clamp( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
}
