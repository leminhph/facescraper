/* eslint no-unused-vars: "warn" */
const k8s = require("@pulumi/kubernetes")

const appLabels = { app: "facescraper" }

const deployment = new k8s.apps.v1.Deployment("facescraper", {
  spec: {
    selector: { matchLabels: appLabels },
    replicas: 1,
    template: {
      metadata: { labels: appLabels },
      spec: {
        containers: [
          {
            name: "facescraper",
            image: "leminhph/facescraper:latest",
            imagePullPolicy: "Always",
            ports: [
              {
                name: "http",
                containerPort: 3333
              }
            ],
            env: [
              {
                name: "HEADLESS",
                value: "true"
              }
            ]
          }
        ]
      }
    }
  }
})

const service = new k8s.core.v1.Service("facescraper", {
  spec: {
    selector: appLabels,
    ports: [{ port: 3333, targetPort: 3333, name: "http" }]
  }
})

const mapping = service.metadata.name.apply(
  name =>
    new k8s.apiextensions.CustomResource("facescraper", {
      apiVersion: "getambassador.io/v1",
      kind: "Mapping",
      spec: {
        host: `services.k8s.cbed.io`,
        prefix: "/facescraper/",
        service: `${name}.default:3333`,
        bypass_auth: true
      }
    })
)

module.exports = {
  deploymentName: deployment.metadata.name,
  serviceName: service.metadata.name,
  serviceMapping: mapping.metadata.name
}
