import { ServiceContainerBuilder, injectable, createService } from "@wroud/di";

export function mockSyncServicesCollection() {
  const Logger = createService("Logger");

  @injectable()
  class DatabaseConnection {}
  @injectable(() => [DatabaseConnection])
  class Database {}

  @injectable()
  class Request {}
  @injectable(() => [Logger, Request])
  class GQLServer {}

  @injectable(() => [Logger, DatabaseConnection, GQLServer])
  class App {}

  @injectable(() => [Database])
  class DBUsers {}
  @injectable(() => [Database])
  class DBArticles {}
  @injectable(() => [Database])
  class DBComments {}
  @injectable(() => [Database])
  class SessionStore {}

  @injectable(() => [Request, DBUsers])
  class Profile {}
  @injectable(() => [Request, SessionStore])
  class Session {}

  return new ServiceContainerBuilder()
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
}
