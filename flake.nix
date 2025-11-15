{
  description = "";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs = { nixpkgs, systems, ... }:
  let
    perSystem = fn: nixpkgs.lib.genAttrs (import systems) (system: fn {
      inherit system;
      pkgs = import nixpkgs { inherit system; };
    });
  in
  {
    devShells = perSystem ({ pkgs, ... }:
    {
      default = pkgs.mkShell { packages = [
        pkgs.bashInteractive
        pkgs.pnpm
        pkgs.nodejs_24
      ]; };
    });
  };
}
