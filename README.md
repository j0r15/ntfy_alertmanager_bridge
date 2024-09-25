# ntfy alertmanager bridge

A basic alertmanager bridge to ntfy. Currently, you can pass a `jq` selector for the following fields:

- ntfy topic
- ntfy title
- ntfy priority
- ntfy message
- ntfy tags / emoji's

that receives the each individual prometheus [alert object](https://prometheus.io/docs/alerting/latest/notifications/#alert) in the [alertmanager webhook config](alertmanager/alertmanager/config.yml):

```sh
...
receivers:
  - name: "ntfy-servers"
    webhook_configs:
      - url: http://ntfy_alertmanager_bridge:30000/ntfy_alert
        send_resolved: true
        max_alerts: 0
...
```

alert.alerts

```
groups:
- name: Nodes
  rules:
    - alert: InstanceDown
      expr: up == 0
      for: 1m
      annotations:
        title: 'Instance {{ $labels.instance }} down'
        description: '{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes.'
        tags: 'rotating_light' # emojiiii for clearity
      labels:
        severity: 'critical'
- name: Services
  rules:
  - alert: ServiceDown
    expr: probe_success == 0
    for: 1m
    annotations:
      title: 'Service running on {{ $labels.instance }} is down'
      description: '{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes.'
      tags: 'warning,rotating_light' #multiple tags are a thing
    labels:
      severity: 'critical'
```

which will result in a notification like so:

![example of notification](documentation/example-notification.png "Example notification")

The [docker-compose.yml](docker-compose.yml) contains a prometheus+alertmanager+ntfy+ntfy_alertmanager_bridge if you want to run the stack as is. Or if you want to pull just the ntfy_alertmanager_bridge simply add to your docker-compose.yml:

```sh
...

  ntfy_alertmanager_bridge:
    image: ghcr.io/j0r15/ntfy_alertmanager_bridge:main
    container_name: ntfy_alertmanager_bridge 
    ports:
      - 30000:30000
    environment:
      - NTFY_SERVER_ADDRESS=http://ntfy:80
      - NTFY_TOKEN=<your_token_here>
      - NTFY_TOPIC=<your_topic_here>

...
```
