{ pkgs, packages }:
with packages;
{
  system = [
    coreutils
    sd
    bash
    jq
    yq-go
    gawk
  ];

  dev = [
    pls
    git
    doctl
  ];

  main = [
    opentofu
    kubectx
    ncurses
    terraform
    bun
    curl
    dogdns
  ];

  lint = [
    # core
    treefmt

    # additional linters
    infisical
    terraform-docs
    tfsec
    tflint
  ];
}
