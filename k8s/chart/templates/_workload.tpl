{{/*
One component's Deployment, Service and optional Ingress. The caller passes
root (the chart context), component (its name), values (its values block),
env (the environment the component needs, which wins over values.env) and
probe (a probe handler).
*/}}
{{- define "asteria.workload" -}}
{{- $name := include "asteria.componentName" . -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $name }}
  namespace: {{ .root.Release.Namespace }}
  labels:
    {{- include "asteria.labels" . | nindent 4 }}
spec:
  replicas: {{ .values.replicaCount }}
  selector:
    matchLabels:
      {{- include "asteria.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "asteria.selectorLabels" . | nindent 8 }}
    spec:
      {{- with include "asteria.placement" . | trim }}
      {{- . | nindent 6 }}
      {{- end }}
      {{- with .values.podSecurityContext }}
      securityContext:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      containers:
        - name: {{ .component }}
          image: {{ include "asteria.image" . }}
          imagePullPolicy: {{ .values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .values.port | int }}
          env:
            {{- range $key, $value := merge (dict) .env .values.env }}
            - name: {{ $key }}
              value: {{ $value | toString | quote }}
            {{- end }}
          {{- with .values.existingSecret }}
          envFrom:
            - secretRef:
                name: {{ . }}
          {{- end }}
          readinessProbe:
            {{- toYaml .probe | nindent 12 }}
            periodSeconds: 10
          livenessProbe:
            {{- toYaml .probe | nindent 12 }}
            periodSeconds: 20
            failureThreshold: 3
          {{- with .values.resources }}
          resources:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          {{- with .values.securityContext }}
          securityContext:
            {{- toYaml . | nindent 12 }}
          {{- end }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ $name }}
  namespace: {{ .root.Release.Namespace }}
  labels:
    {{- include "asteria.labels" . | nindent 4 }}
  {{- with .values.service.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
  type: {{ .values.service.type }}
  selector:
    {{- include "asteria.selectorLabels" . | nindent 4 }}
  ports:
    - name: http
      port: {{ .values.service.port }}
      targetPort: http
{{- with .values.ingress }}
{{- if .enabled }}
{{- $host := required (printf "%s.ingress.host is required" $.component) .host }}
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ $name }}
  namespace: {{ $.root.Release.Namespace }}
  labels:
    {{- include "asteria.labels" $ | nindent 4 }}
  annotations:
    cert-manager.io/cluster-issuer: {{ required (printf "%s.ingress.clusterIssuer is required" $.component) .clusterIssuer }}
    {{- with .annotations }}
    {{- toYaml . | nindent 4 }}
    {{- end }}
spec:
  ingressClassName: {{ required (printf "%s.ingress.className is required" $.component) .className }}
  rules:
    - host: {{ $host }}
      http:
        paths:
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ $name }}
                port:
                  name: http
  tls:
    - hosts:
        - {{ $host }}
      secretName: {{ required (printf "%s.ingress.tlsSecretName is required" $.component) .tlsSecretName }}
{{- end }}
{{- end }}
{{- end -}}
