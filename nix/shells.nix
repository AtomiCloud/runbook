{ pkgs, packages, env, shellHook }:
with env;
{
  default = pkgs.mkShell {
    buildInputs = system ++ main ++ dev ++ lint;
    inherit shellHook;
    INFISICAL_DISABLE_UPDATE_CHECK = "true";
  };
  ci = pkgs.mkShell {
    buildInputs = system ++ main ++ lint;
    inherit shellHook;

  };
}
