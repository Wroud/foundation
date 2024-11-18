<script setup lang="ts">
import { ServiceContainerBuilder, injectable, createService } from "@wroud/di";

class DatabaseConnection {}

class Database {}
class DBUsers {}
class DBArticles {}
class DBComments {}

class App {}

class Request {}
class GQLServer {}
class Profile {}
class Session {}
class SessionStore {}

const Logger = createService("Logger");

injectable(() => [])(DatabaseConnection);
injectable(() => [DatabaseConnection])(Database);
injectable(() => [Database])(DBUsers);
injectable(() => [Database])(DBArticles);
injectable(() => [Database])(DBComments);
injectable(({ optional }) => [optional(Logger), DatabaseConnection, GQLServer])(
  App,
);

injectable(() => [])(Request);
injectable(() => [Request, DBUsers])(Profile);
injectable(({ optional }) => [Request, optional(SessionStore)])(Session);
injectable(() => [Database])(SessionStore);
injectable(() => [Request])(GQLServer);

const serviceCollection = new ServiceContainerBuilder()
  .addSingleton(App)
  .addSingleton(DatabaseConnection)
  .addSingleton(GQLServer)
  .addTransient(Database)
  .addTransient(SessionStore)
  .addTransient(DBUsers)
  .addTransient(DBArticles)
  .addTransient(DBComments)
  .addScoped(Request)
  .addScoped(Profile)
  .addScoped(Session);
</script>

<template>
  <DependenciesGraph
    width="100%"
    height="512"
    :serviceCollection="serviceCollection"
  />
</template>
