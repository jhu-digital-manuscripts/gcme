// The formatting here is designed to help make this type actually be
// comprehensible to mortals, including the mortals who came up with it.
// prettier-ignore

// A way of representing non-user-constructible types. You can conveniently use
// this by doing `interface Type extends Opaque<'some-type-name'> { ... }` for
// simple types, and/or you can type-parameterize it as makes sense for your use
// case (see e.g. `@ember/component/helper`'s use with functional helpers).

class Opaque {}

export { Opaque };
