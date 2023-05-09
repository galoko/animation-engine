@fragment
fn main(
    @location(0) fragNormal: vec3<f32>,
    @location(1) fragUV: vec2<f32>,
) -> @location(0) vec4<f32> {
    var lightDir = normalize(vec3(0.656, 0.3, 0.14));
    var lightColor = vec3(1.);

    var diff = max(dot(fragNormal, lightDir), 0.0);
    var diffuse = diff * lightColor;

    var ambient = 0.5;

    var objectColor = vec4(fragUV.x, 0.0, fragUV.y, 0.25);

    var outputColor = vec4(min(ambient + diffuse, vec3(1)) * objectColor.rgb, objectColor.a);

    return outputColor;
}