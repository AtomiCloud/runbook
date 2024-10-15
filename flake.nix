{
  inputs = {
    # util
    flake-utils.url = "github:numtide/flake-utils";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    pre-commit-hooks.url = "github:cachix/pre-commit-hooks.nix";

    # registry
    nixpkgs.url = "nixpkgs/5e0ca22929f3342b19569b21b2f3462f053e497b";
    nixpkgs-2405.url = "nixpkgs/nixos-24.05";
    nixpkgs-230927.url = "nixpkgs/4ab8a3de296914f3b631121e9ce3884f1d34e1e5";
    nixpkgs-241012.url = "nixpkgs/5633bcff0c6162b9e4b5f1264264611e950c8ec7";
    atomipkgs.url = "github:kirinnee/test-nix-repo/v28.0.0";
  };
  outputs =
    { self

      # utils
    , flake-utils
    , treefmt-nix
    , pre-commit-hooks

      # registries
    , atomipkgs
    , nixpkgs
    , nixpkgs-2405
    , nixpkgs-230927
    , nixpkgs-241012

    } @inputs:
    (flake-utils.lib.eachDefaultSystem
      (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          atomi = atomipkgs.packages.${system};
          pkgs-2405 = nixpkgs-2405.legacyPackages.${system};
          pkgs-230927 = nixpkgs-230927.legacyPackages.${system};
          pkgs-241012 = nixpkgs-241012.legacyPackages.${system};
          pre-commit-lib = pre-commit-hooks.lib.${system};
        in
        with rec {
          pre-commit = import ./nix/pre-commit.nix {
            inherit packages pre-commit-lib formatter;
          };
          formatter = import ./nix/fmt.nix {
            inherit treefmt-nix pkgs;
          };
          packages = import ./nix/packages.nix
            {
              inherit pkgs atomi pkgs-2405 pkgs-230927 pkgs-241012;
            };
          env = import ./nix/env.nix {
            inherit pkgs packages;
          };
          devShells = import ./nix/shells.nix {
            inherit pkgs env packages;
            shellHook = checks.pre-commit-check.shellHook;
          };
          checks = {
            pre-commit-check = pre-commit;
            format = formatter;
          };
        };
        {
          inherit checks formatter packages devShells;
        }
      )
    )
  ;

}
