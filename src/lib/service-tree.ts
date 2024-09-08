import type {
  CloudTreeCloud,
  CloudTreeCloudPrincipal,
  CloudTreeClusterPrincipal,
  CloudTreeClusterSetPrincipal,
  ServiceTreeLandscapePrincipal,
  ServiceTreePlatform,
  ServiceTreePlatformPrincipal,
} from './service-tree-def.ts';

const LANDSCAPES = {
  arceus: {
    name: 'Arceus',
    slug: 'arceus',
    description: 'Global meta landscape-agnostic administrative environment',
  },
  pinsir: {
    name: 'Pinsir',
    slug: 'pinsir',
    description: 'Continuous Integration',
  },

  lapras: {
    name: 'Lapras',
    slug: 'lapras',
    description: 'Local development',
  },

  tauros: {
    name: 'Tauros',
    slug: 'tauros',
    description: 'Local Development (Production Parity)',
  },

  absol: {
    name: 'Absol',
    slug: 'absol',
    description: 'Test environment',
  },

  pichu: {
    name: 'Pichu',
    slug: 'pichu',
    description: 'Singapore Development Environment',
  },

  pikachu: {
    name: 'Pikachu',
    slug: 'pikachu',
    description: 'Singapore Staging Environment',
  },

  raichu: {
    name: 'Raichu',
    slug: 'raichu',
    description: 'Singapore Production Environment',
  },

  suicune: {
    name: 'Suicune',
    slug: 'suicune',
    description: 'Singapore administrative environment',
  },

  entei: {
    name: 'Entei',
    slug: 'entei',
    description: 'Singapore physical landscape',
  },
} satisfies Record<string, ServiceTreeLandscapePrincipal>;

const CLOUDS = {
  DigitalOcean: {
    name: 'DigitalOcean',
    slug: 'digitalocean',
    description: 'DigitalOcean Cloud',
  },
  Linode: {
    name: 'Linode',
    slug: 'linode',
    description: 'Linode Cloud, Akamai',
  },
  Vultr: {
    name: 'Vultr',
    slug: 'vultr',
    description: 'Vultr Cloud',
  },
  AWS: {
    name: 'AWS',
    slug: 'aws',
    description: 'AWS Cloud, Amazon Web Services',
  },
  GCP: {
    name: 'GCP',
    slug: 'gcp',
    description: 'GCP Cloud, Google Cloud Platform',
  },
  Azure: {
    name: 'Azure',
    slug: 'azure',
    description: 'Azure Cloud, Microsoft Azure',
  },
} satisfies Record<string, CloudTreeCloudPrincipal>;

const CLUSTER_SETS = {
  OpalRuby: {
    name: 'OpalRuby',
    slug: 'opal-ruby',
    description: 'Opal-Ruby Cluster Set',
  },
  OnyxJade: {
    name: 'OnyxJade',
    slug: 'onyx-jade',
    description: 'Onyx-Jade Cluster Set',
  },
  MicaTalc: {
    name: 'MicaTalc',
    slug: 'mica-talc',
    description: 'Mica-Talc Cluster Set',
  },
  TopazAmber: {
    name: 'TopazAmber',
    slug: 'topaz-amber',
    description: 'Topaz-Amber Cluster Set',
  },
  AgateLapis: {
    name: 'AgateLapis',
    slug: 'agate-lapis',
    description: 'Agate-Lapis Cluster Set',
  },
  BerylCoral: {
    name: 'BerylCoral',
    slug: 'beryl-coral',
    description: 'Beryl-Coral Cluster Set',
  },
} satisfies Record<string, CloudTreeClusterSetPrincipal>;

const CLUSTERS = {
  Opal: {
    name: 'Opal',
    slug: 'opal',
    description: 'Opal Cluster',
  },
  Ruby: {
    name: 'Ruby',
    slug: 'ruby',
    description: 'Ruby Cluster',
  },
  Onyx: {
    name: 'Onyx',
    slug: 'onyx',
    description: 'Onyx Cluster',
  },
  Jade: {
    name: 'Jade',
    slug: 'jade',
    description: 'Jade Cluster',
  },
  Mica: {
    name: 'Mica',
    slug: 'mica',
    description: 'Mica Cluster',
  },
  Talc: {
    name: 'Talc',
    slug: 'talc',
    description: 'Talc Cluster',
  },
  Topaz: {
    name: 'Topaz',
    slug: 'topaz',
    description: 'Topaz Cluster',
  },
  Amber: {
    name: 'Amber',
    slug: 'amber',
    description: 'Amber Cluster',
  },
  Agate: {
    name: 'Agate',
    slug: 'agate',
    description: 'Agate Cluster',
  },
  Lapis: {
    name: 'Lapis',
    slug: 'lapis',
    description: 'Lapis Cluster',
  },
  Beryl: {
    name: 'Beryl',
    slug: 'beryl',
    description: 'Beryl Cluster',
  },
  Coral: {
    name: 'Coral',
    slug: 'coral',
    description: 'Coral Cluster',
  },
} satisfies Record<string, CloudTreeClusterPrincipal>;

const PLATFORMS = {
  Sulfoxide: {
    name: 'Sulfoxide',
    slug: 'sulfoxide',
    description: 'System and infrastructure components',
  },
  Nitroso: {
    name: 'Nitroso',
    slug: 'nitroso',
    description: 'BunnyBooker',
  },
  Azo: {
    name: 'Azo',
    slug: 'azo',
    description: 'Romantic Song Composer',
  },
} satisfies Record<string, ServiceTreePlatformPrincipal>;

// Associations
const SERVICE_TREE = {
  sulfoxide: {
    principal: PLATFORMS.Sulfoxide,
    services: {
      aws_adapter: {
        principal: {
          name: 'AWS Adapter',
          slug: 'lead',
          description: 'AWS Adapters, like CSI and ELB controller',
          projectId: '',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      sos: {
        principal: {
          name: 'Secret of secrets',
          slug: 'sos',
          description: 'Secrets of other infisical secrets',
          projectId: '1cffa31e-7653-4c0d-9a18-9914a2dbc30b',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      metricsServer: {
        principal: {
          name: 'Metrics Server',
          slug: 'xenon',
          description: 'Metrics Server for Cluster',
          projectId: '',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      tofu: {
        principal: {
          name: 'Tofu',
          slug: 'tofu',
          description: 'IaC for AtomiCloud',
          projectId: '5c418f54-d211-46dd-a263-e4c07585b47d',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      argocd: {
        principal: {
          name: 'ArgoCD',
          slug: 'helium',
          description: 'Deployment platform using GitOps',
          projectId: '7b458fa1-1225-40ce-8e48-3f4a67031bc0',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      backup_engine: {
        principal: {
          name: 'Backup Engine',
          slug: 'fluorine',
          description: 'Velero as the backup engine for Kubernetes',
          projectId: 'd712436d-2022-4970-838b-f0b854a83c9c',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      secrets_engine: {
        principal: {
          name: 'Secrets Engine',
          slug: 'cobalt',
          description: 'External Secrets to sync secrets from infisical',
          projectId: '1c2bc52e-c49b-4307-ad41-ff69a755beed',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      internal_ingress: {
        principal: {
          name: 'Internal Ingress',
          slug: 'boron',
          description: 'Internal Ingress with cloudflared',
          projectId: '9ab0fcd2-ee24-4dd4-8701-c530b888b805',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      external_ingress: {
        principal: {
          name: 'External Ingress',
          slug: 'gold',
          description: 'External Ingress with nginx',
          projectId: '47c29693-3255-4a5b-b0a7-09e0281e1910',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      scaler: {
        principal: {
          name: 'Pod Autoscaler',
          slug: 'iron',
          description: 'KEDA scaler for pods',
          projectId: 'ca687032-485f-4d09-9d7c-5d0f50bf3ab3',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      cluster_scaler: {
        principal: {
          name: 'Cluster Scaler',
          slug: 'krypton',
          description: 'Karpenter scaler for nodes',
          projectId: '',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      cluster_issuer: {
        principal: {
          name: 'Cluster Issuer',
          slug: 'zinc',
          description: 'Cluster Issuer for Certificate',
          projectId: 'eb3db9f2-3b49-493c-81df-8528121c0ccc',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      cert_manager: {
        principal: {
          name: 'Cert Manager',
          slug: 'sulfur',
          description: 'Certificate Issuing operator',
          projectId: '8a244c1b-f58a-40c0-92dd-585ffa2787d1',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      reloader: {
        principal: {
          name: 'Reloader',
          slug: 'chlorine',
          description: 'Reloader',
          projectId: '',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      policy_engine: {
        principal: {
          name: 'Policy Engine',
          slug: 'argon',
          description: 'Kyverno operator',
          projectId: '3cc63883-9ec6-42c1-9772-8570620de422',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      policies: {
        principal: {
          name: 'Policies',
          slug: 'sodium',
          description: 'Kyverno policies',
          projectId: 'cd55ee78-bf70-4853-9bb1-fcc9f3d445cd',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      otel_collector: {
        principal: {
          name: 'OpenTelemetry Collector',
          slug: 'silicon',
          description: 'OpenTelemetry Collector',
          projectId: '3e90c2ef-7007-47a4-bd6a-bac6cdae7396',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      otel_operator: {
        principal: {
          name: 'OpenTelemetry Operator',
          slug: 'lithium',
          description: 'OpenTelemetry Operator',
          projectId: 'ef96dd70-dea3-4548-81b7-0a22231b54ad',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      external_dns: {
        principal: {
          name: 'External DNS',
          slug: 'tin',
          description: 'External DNS',
          projectId: '4c3d88b5-977d-449f-8f4c-2bf9e09e97c8',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      vcluster: {
        principal: {
          name: 'Virtual Cluster',
          slug: 'iodine',
          description: 'Virtual clusters with vcluster',
          projectId: 'e0c572b3-4eb8-40c6-85ea-f9cf54b6e13b',
        },
        platform: PLATFORMS.Sulfoxide,
      },
      infisical: {
        principal: {
          name: 'Infisical',
          slug: 'infisical',
          description: 'SecretOps platform',
          projectId: '',
        },
        platform: PLATFORMS.Sulfoxide,
      },
    },
  },
  nitroso: {
    principal: PLATFORMS.Nitroso,
    services: {
      tin: {
        principal: {
          name: 'BunnyBooker Polling System',
          slug: 'tin',
          description: 'System of pollers for BunnyBooker',
          projectId: 'df53bb81-dee0-4479-b515-3cab9af7386f',
        },
        platform: PLATFORMS.Nitroso,
      },
      zinc: {
        principal: {
          name: 'BunnyBooker API Server',
          slug: 'zinc',
          description: 'API Server for BunnyBooker',
          projectId: '3b4f93e1-aab6-4b4a-a883-55de7eb401ea',
        },
        platform: PLATFORMS.Nitroso,
      },
      argon: {
        principal: {
          name: 'BunnyBooker Frontend',
          slug: 'argon',
          description: 'Frontend for BunnyBooker',
          projectId: '65f937ec-50a5-4551-9338-eb146df712af',
        },
        platform: PLATFORMS.Nitroso,
      },
      helium: {
        principal: {
          name: 'Pollee',
          slug: 'helium',
          description: 'Pollee for BunnyBooker',
          projectId: 'cc897910-0fe7-4784-ac3d-be9847fca2d9',
        },
        platform: PLATFORMS.Nitroso,
      },
    },
  },
  azo: {
    principal: PLATFORMS.Azo,
    services: {},
  },
} satisfies Record<string, ServiceTreePlatform>;

const CLOUD_TREE = {
  DigitalOcean: {
    principal: CLOUDS.DigitalOcean,
    clusterSets: {
      OpalRuby: {
        principal: CLUSTER_SETS.OpalRuby,
        cloud: CLOUDS.DigitalOcean,
        clusters: [
          {
            principal: CLUSTERS.Opal,
            cloud: CLOUDS.DigitalOcean,
            set: CLUSTER_SETS.OpalRuby,
          },
          {
            principal: CLUSTERS.Ruby,
            cloud: CLOUDS.DigitalOcean,
            set: CLUSTER_SETS.OpalRuby,
          },
        ],
      },
    },
  },
  Linode: {
    principal: CLOUDS.Linode,
    clusterSets: {
      OnyxJade: {
        cloud: CLOUDS.Linode,
        principal: CLUSTER_SETS.OnyxJade,
        clusters: [
          {
            principal: CLUSTERS.Onyx,
            cloud: CLOUDS.Linode,
            set: CLUSTER_SETS.OnyxJade,
          },
          {
            principal: CLUSTERS.Jade,
            cloud: CLOUDS.Linode,
            set: CLUSTER_SETS.OnyxJade,
          },
        ],
      },
    },
  },
  // vultr - mica talc
  Vultr: {
    principal: CLOUDS.Vultr,
    clusterSets: {
      MicaTalc: {
        cloud: CLOUDS.Vultr,
        principal: CLUSTER_SETS.MicaTalc,
        clusters: [
          {
            principal: CLUSTERS.Mica,
            cloud: CLOUDS.Vultr,
            set: CLUSTER_SETS.MicaTalc,
          },
          {
            principal: CLUSTERS.Talc,
            cloud: CLOUDS.Vultr,
            set: CLUSTER_SETS.MicaTalc,
          },
        ],
      },
    },
  },
  // aws - topaz amber
  AWS: {
    principal: CLOUDS.AWS,
    clusterSets: {
      TopazAmber: {
        cloud: CLOUDS.AWS,
        principal: CLUSTER_SETS.TopazAmber,
        clusters: [
          {
            principal: CLUSTERS.Topaz,
            cloud: CLOUDS.AWS,
            set: CLUSTER_SETS.TopazAmber,
          },
          {
            principal: CLUSTERS.Amber,
            cloud: CLOUDS.AWS,
            set: CLUSTER_SETS.TopazAmber,
          },
        ],
      },
    },
  },
  // gcp - agate lapis
  GCP: {
    principal: CLOUDS.GCP,
    clusterSets: {
      AgateLapis: {
        cloud: CLOUDS.GCP,
        principal: CLUSTER_SETS.AgateLapis,
        clusters: [
          {
            principal: CLUSTERS.Agate,
            cloud: CLOUDS.GCP,
            set: CLUSTER_SETS.AgateLapis,
          },
          {
            principal: CLUSTERS.Lapis,
            cloud: CLOUDS.GCP,
            set: CLUSTER_SETS.AgateLapis,
          },
        ],
      },
    },
  },
  // azure - beryl coral
  Azure: {
    principal: CLOUDS.Azure,
    clusterSets: {
      BerylCoral: {
        cloud: CLOUDS.Azure,
        principal: CLUSTER_SETS.BerylCoral,
        clusters: [
          {
            principal: CLUSTERS.Beryl,
            cloud: CLOUDS.Azure,
            set: CLUSTER_SETS.BerylCoral,
          },
          {
            principal: CLUSTERS.Coral,
            cloud: CLOUDS.Azure,
            set: CLUSTER_SETS.BerylCoral,
          },
        ],
      },
    },
  },
} satisfies Record<string, CloudTreeCloud>;

const LANDSCAPE_TREE = {
  a: [LANDSCAPES.suicune],
  v: [LANDSCAPES.pichu, LANDSCAPES.pikachu, LANDSCAPES.raichu],
  l: [LANDSCAPES.lapras, LANDSCAPES.tauros, LANDSCAPES.absol, LANDSCAPES.pinsir],
  p: [LANDSCAPES.entei],
} satisfies Record<string, ServiceTreeLandscapePrincipal[]>;

export { LANDSCAPES, CLOUDS, CLUSTERS, CLUSTER_SETS, PLATFORMS, SERVICE_TREE, CLOUD_TREE, LANDSCAPE_TREE };
