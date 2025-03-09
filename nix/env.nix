{ pkgs, packages }:
with packages;
{
  system = [
    atomiutils
    sd
  ];

  dev = [
    pls
    git
    doctl
  ];

  main = [
    ncurses
    infrautils
    bun
  ];

  lint = [
    # core
    treefmt

    # additional linters
    infisical
    infralint
    #    terraform-docs
    #    tfsec
    #    tflint
  ];
}
