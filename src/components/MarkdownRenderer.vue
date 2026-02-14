<template>
  <div class="markdown-body" v-html="renderedMarkdown"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import 'github-markdown-css/github-markdown.css'

interface Props {
  content: string
}

const props = defineProps<Props>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str: string, lang: string) {
    return str;
  }
})

const renderedMarkdown = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})
</script>

<style>
@import 'github-markdown-css/github-markdown.css';

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
  background-color: transparent !important;
  color: inherit !important;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.markdown-body p {
  margin: 0.5em 0;
}

.markdown-body pre,
.markdown-body code {
  background-color: rgba(110, 118, 129, 0.1) !important;
  border-radius: 4px;
}

.markdown-body pre {
  padding: 1em;
}

.markdown-body code {
  padding: 0.2em 0.4em;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #8b949e;
  border-left: 0.25em solid #30363d;
}

.markdown-body table {
  display: table;
  border-collapse: collapse;
  margin: 0;
  overflow: auto;
  width: 100%;
  background-color: var(--ant-color-bg-container);
}

.markdown-body table tr {
  background-color: var(--ant-color-bg-container);
  border-top: 1px solid var(--ant-color-split);
}

.markdown-body table tr:nth-child(2n) {
  background-color: var(--ant-color-fill-secondary);
}

.markdown-body table td,
.markdown-body table th {
  padding: 6px 13px;
  border: 1px solid var(--ant-color-split);
  color: var(--ant-color-text);
}

.markdown-body table th {
  background-color: var(--ant-color-fill-content);
  font-weight: 600;
}

.markdown-body table td {
  background-color: var(--ant-color-bg-container);
}

.markdown-body table tr:hover {
  background-color: var(--ant-color-fill);
}
</style>