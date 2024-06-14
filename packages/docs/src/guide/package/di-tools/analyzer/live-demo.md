---
outline: false
aside: false
---

<script setup>
const defaultGraph=`{"nodes":[{"id":"4b11c9e4-44c4-4214-a3f6-8c371bf63408","name":"IServiceProvider","lifetime":0},{"id":"eaa53f18-7672-47c8-99e3-08ccf7416541","name":"App","lifetime":0},{"id":"511e40a2-b99c-47cc-aa31-19856b3e25de","name":"Logger","lifetime":2,"notFound":true},{"id":"5d415531-e0e0-415f-89c8-26afb92353f1","name":"DatabaseConnection","lifetime":0},{"id":"d0e0072f-3763-45be-af46-d90bed784856","name":"GQLServer","lifetime":0},{"id":"585891bd-cbc7-4237-b868-580649217529","name":"Database","lifetime":2},{"id":"264bef9d-bfe4-4dec-be8a-7f2d0ac7173f","name":"SessionStore","lifetime":2},{"id":"d47e4b35-d9fb-4be1-b181-e8af69a4ac00","name":"DBUsers","lifetime":2},{"id":"12b210d3-a7f9-4b5f-ad92-dc9bc369caed","name":"DBArticles","lifetime":2},{"id":"ddcdd61d-f8f2-47ca-ac63-c54bd38c7ff8","name":"DBComments","lifetime":2},{"id":"f7962c88-9b57-4f17-88fa-5c545271cfa6","name":"Request","lifetime":1},{"id":"29f281b9-1b97-4d45-9861-1bcc52826df6","name":"Profile","lifetime":1},{"id":"b1e2df08-660a-4a2d-a932-e69336554cc3","name":"Session","lifetime":1}],"links":[{"source":"eaa53f18-7672-47c8-99e3-08ccf7416541","target":"511e40a2-b99c-47cc-aa31-19856b3e25de","name":"App -> Logger"},{"source":"eaa53f18-7672-47c8-99e3-08ccf7416541","target":"5d415531-e0e0-415f-89c8-26afb92353f1","name":"App -> DatabaseConnection"},{"source":"eaa53f18-7672-47c8-99e3-08ccf7416541","target":"d0e0072f-3763-45be-af46-d90bed784856","name":"App -> GQLServer"},{"source":"585891bd-cbc7-4237-b868-580649217529","target":"5d415531-e0e0-415f-89c8-26afb92353f1","name":"Database -> DatabaseConnection"},{"source":"264bef9d-bfe4-4dec-be8a-7f2d0ac7173f","target":"585891bd-cbc7-4237-b868-580649217529","name":"SessionStore -> Database"},{"source":"d47e4b35-d9fb-4be1-b181-e8af69a4ac00","target":"585891bd-cbc7-4237-b868-580649217529","name":"DBUsers -> Database"},{"source":"12b210d3-a7f9-4b5f-ad92-dc9bc369caed","target":"585891bd-cbc7-4237-b868-580649217529","name":"DBArticles -> Database"},{"source":"ddcdd61d-f8f2-47ca-ac63-c54bd38c7ff8","target":"585891bd-cbc7-4237-b868-580649217529","name":"DBComments -> Database"},{"source":"29f281b9-1b97-4d45-9861-1bcc52826df6","target":"f7962c88-9b57-4f17-88fa-5c545271cfa6","name":"Profile -> Request"},{"source":"29f281b9-1b97-4d45-9861-1bcc52826df6","target":"d47e4b35-d9fb-4be1-b181-e8af69a4ac00","name":"Profile -> DBUsers"},{"source":"b1e2df08-660a-4a2d-a932-e69336554cc3","target":"f7962c88-9b57-4f17-88fa-5c545271cfa6","name":"Session -> Request"},{"source":"b1e2df08-660a-4a2d-a932-e69336554cc3","target":"264bef9d-bfe4-4dec-be8a-7f2d0ac7173f","name":"Session -> SessionStore"}]}`
</script>

# Live Demo

<DependenciesGraph
    width="100%"
    height="512"
    :defaultGraph="defaultGraph"
    displayImport
  />
