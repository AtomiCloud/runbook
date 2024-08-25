#!/usr/bin/env bash

set -eou pipefail

# generating kubeconfig folders
echo "🛠️ Generate kubeconfig folders..."
mkdir -p ~/.kube/atomiconfigs
rm -rf ~/.kube/atomiconfigs
mkdir -p ~/.kube/atomiconfigs
mkdir -p ~/.kube/k3dconfigs
mkdir -p ~/.kube/configs
echo "✅ Folders are generated!"

# generate infisical folders
echo "🛠️ Generate infisical config..."
mkdir -p ~/.infisical
infisical_json=$(
  cat <<EOF
{
    "workspaceId": "1cfbdaa6-fff6-4e27-aa17-f0f4cf26da60",
    "defaultEnvironment": "suicune",
    "gitBranchToEnvironmentMapping": null
}
EOF
)
echo "${infisical_json}" >"$HOME/.infisical/.infisical.json"
echo "✅ Infisical config is generated!"

echo "🛠️ Listing AtomiCloud access credentials..."
cd "$HOME/.infisical" || exit

# shellcheck disable=SC2116,SC2086,SC2153
slugs=$(echo $SLUGS)

# Initialize an empty array
combined_array="[]"

# shellcheck disable=SC2068
for slug in ${slugs[@]}; do
  # Execute the command with the current slug and get the JSON array
  json_array=$(infisical export --env "$slug" -f json)

  # Merge the current JSON array into the combined array
  combined_array=$(jq -s 'add' <(echo "$combined_array") <(echo "$json_array"))
done

# completed
echo "✅ AtomiCloud access credentials are listed!"

# generating kubeconfig from access credentials
echo "🛠️ Generating kubeconfig from access credentials..."
jq -cr '.[].value' <<<"$combined_array" | while read -r element; do
  config=$(jq -r '.config' <<<"$element")
  name=$(jq -r '.name' <<<"$element")
  server=$(jq -r '.server' <<<"$element")
  token=$(jq -r '.bearerToken' <<<"$config")
  ca_cert=$(jq -r '.tlsClientConfig.caData' <<<"$config")
  kc=$(
    cat <<EOF
apiVersion: v1
clusters:
  - cluster:
      certificate-authority-data: ${ca_cert}
      server: ${server}
    name: ${name}
contexts:
  - context:
      cluster: ${name}
      user: ${name}
    name: ${name}
current-context: ${name}
kind: Config
preferences: {}
users:
  - name: ${name}
    user:
      token: ${token}
EOF
  )
  echo "$kc" >"$HOME/.kube/atomiconfigs/${name}.yaml"
done

# list kubeconfig paths
echo "📋 Listing kubeconfig paths..."
basic_configs=$(find "$HOME/.kube/configs" -type f | awk 'ORS=":"')
k3d_configs=$(find "$HOME/.kube/k3dconfigs" -type f | awk 'ORS=":"')
atomi_configs=$(find "$HOME/.kube/atomiconfigs" -type f | awk 'ORS=":"')
all_configs="${basic_configs}${k3d_configs}${atomi_configs}"
echo "✅ Paths are listed: ${all_configs}"

echo "🛠️ Attempting to merge kubeconfig cluster..."
KUBECONFIG=$all_configs kubectl config view --flatten >~/.kube/config
chmod 600 ~/.kube/config
echo "✅ Config is merged!"

# retrieve vcluster kubeconfigs
echo "🛠️ Retrieving vCluster kubeconfigs..."

# shellcheck disable=SC2068
for pcluster in ${PCLUSTERS[@]}; do
  echo "👾 Retrieving kubeconfig for vCluster in physical cluster '${pcluster}'..."
  kubectx | cat | grep "${pcluster}" | while IFS= read -r pc; do

    # shellcheck disable=SC2068
    for vcluster in ${VCLUSTERS[@]}; do
      secret_name="vc-${pcluster}-${vcluster}-iodine"

      set +e
      encoded_yaml=$(kubectl --context "${pc}" --namespace "${vcluster}" get secret "${secret_name}" -o jsonpath="{.data.config}")
      # shellcheck disable=SC2181
      if [ "$?" -ne 0 ] || [ -z "$encoded_yaml" ]; then
        echo "❌ Secret '${secret_name}' not found. Skipping..."
        set -e
        continue
      fi
      set -e

      yaml_kubeconfig=$(echo "${encoded_yaml}" | base64 -d)
      cluster_name=$(echo "${yaml_kubeconfig}" | yq -r '.current-context')
      echo "👾 Retrieving kubeconfig for vCluster in virtual cluster '${cluster_name}'..."
      echo "$yaml_kubeconfig" >"$HOME/.kube/atomiconfigs/${cluster_name}.yaml"
    done
  done
done

# list kubeconfig paths
echo "📋 Listing kubeconfig paths..."
basic_configs=$(find "$HOME/.kube/configs" -type f | awk 'ORS=":"')
k3d_configs=$(find "$HOME/.kube/k3dconfigs" -type f | awk 'ORS=":"')
atomi_configs=$(find "$HOME/.kube/atomiconfigs" -type f | awk 'ORS=":"')
all_configs="${basic_configs}${k3d_configs}${atomi_configs}"
echo "✅ Paths are listed: ${all_configs}"

echo "🛠️ Attempting to merge kubeconfig cluster..."
KUBECONFIG=$all_configs kubectl config view --flatten >~/.kube/config
chmod 600 ~/.kube/config
echo "✅ Config is merged!"
