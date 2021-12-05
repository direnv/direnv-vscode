{
  description = "";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    flake-compat.url = "github:edolstra/flake-compat";
    flake-compat.flake = false;
  };

  outputs = { self, flake-utils, nixpkgs, ... }:
    let
      attrs = nixpkgs.lib.importJSON ./package.json;
      inherit (attrs) name version;
      vsix = "${name}-${version}.vsix";
    in
    flake-utils.lib.simpleFlake {
      inherit name self nixpkgs;
      overlay = this: prev: {
        ${name} = {
          vsix = prev.mkYarnPackage {
            src = ./.;
            name = vsix;
            buildPhase = ''
              # fix Error: ENOENT: no such file or directory, stat '/build/$HASH-source/deps/${name}/${name}
              rm deps/${name}/${name}
              # fix Warning: Using '*' activation is usually a bad idea as it impacts performance.
              echo y |
              yarn run --offline vsce package --yarn
            '';
            installPhase = ''
              mv deps/${name}/${vsix} $out
            '';
            distPhase = "true";
          };

          defaultPackage = this.${name}.vsix;

          devShell = prev.mkShell {
            inputsFrom = [ this.${name}.defaultPackage ];
          };
        };
      };
    };
}