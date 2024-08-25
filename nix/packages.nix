{ pkgs, atomi, pkgs-2405, pkgs-230927, pkgs-240810 }:
let

  all = {
    atomipkgs = (
      with atomi;
      {
        inherit
          sg
          pls;
      }
    );
    pkgs230927 = (
      with pkgs-230927;
      {
        inherit terraform;
      }
    );
    pkgs240810 = (
      with pkgs-240810;
      {
        inherit
          coreutils
          sd
          curl
          bash
          jq
          yq-go
          gawk
          gomplate

          # fmt
          treefmt
          opentofu
          kubectx
          ncurses
          bun


          # dev
          git
          doctl

          # main
          infisical

          # lint
          gitlint
          shellcheck
          terraform-docs
          tfsec
          tflint;
      }
    );
    pkgs2405 = (
      with pkgs-2405;
      { }
    );
  };
in
with all;
atomipkgs //
pkgs240810 //
pkgs230927 //
pkgs2405
