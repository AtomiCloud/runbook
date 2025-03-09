{ pkgs, atomi, pkgs-2411 }:
let

  all = {
    atomipkgs = (
      with atomi;
      {
        inherit
          atomiutils
          infrautils
          infralint
          sg
          pls;
      }
    );
    pkgs2411 = (
      with pkgs-2411;
      {
        inherit
          dogdns
          sd

          # fmt
          treefmt
          ncurses
          bun

          # dev
          git
          doctl

          # main
          infisical

          # lint
          gitlint
          shellcheck;
      }
    );
  };
in
with all;
atomipkgs //
pkgs2411
