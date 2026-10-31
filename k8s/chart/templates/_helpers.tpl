{{- define "asteria.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "asteria.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "asteria.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Name of one component's objects: "<fullname>-<component>". */}}
{{- define "asteria.componentName" -}}
{{- printf "%s-%s" (include "asteria.fullname" .root) .component | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "asteria.selectorLabels" -}}
app.kubernetes.io/name: {{ include "asteria.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "asteria.labels" -}}
helm.sh/chart: {{ include "asteria.chart" .root }}
{{ include "asteria.selectorLabels" . }}
app.kubernetes.io/version: {{ .values.image.tag | trunc 63 | quote }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
{{- end -}}

{{- define "asteria.image" -}}
{{- $img := .values.image -}}
{{- $repository := required (printf "%s.image.repository is required" .component) $img.repository -}}
{{- $tag := required (printf "%s.image.tag is required" .component) $img.tag -}}
{{- if $img.digest -}}
{{- printf "%s:%s@%s" $repository $tag $img.digest -}}
{{- else -}}
{{- printf "%s:%s" $repository $tag -}}
{{- end -}}
{{- end -}}

{{/* A component's nodeSelector, falling back to the shared one. */}}
{{- define "asteria.placement" -}}
{{- with (default .root.Values.nodeSelector .values.nodeSelector) }}
nodeSelector:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- with (default .root.Values.tolerations .values.tolerations) }}
tolerations:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end -}}
