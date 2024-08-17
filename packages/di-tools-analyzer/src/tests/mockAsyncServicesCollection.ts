import {
  ServiceContainerBuilder,
  injectable,
  createService,
  lazy,
} from "@wroud/di";

export function mockAsyncServicesCollection() {
  const App = createService("App");
  const DatabaseConnection = createService("DatabaseConnection");
  const Database = createService("Database");
  const GQLServer = createService("GQLServer");
  const DBUsers = createService("DBUsers");
  const DBArticles = createService("DBArticles");
  const DBComments = createService("DBComments");
  const SessionStore = createService("SessionStore");
  const Request = createService("Request");
  const Profile = createService("Profile");
  const Session = createService("Session");
  const Logger = createService("Logger");

  @injectable()
  class DatabaseConnectionImpl {}
  @injectable(() => [DatabaseConnection])
  class DatabaseImpl {}

  @injectable()
  class RequestImpl {}
  @injectable(() => [Logger, Request])
  class GQLServerImpl {}

  @injectable(() => [[Logger], DatabaseConnection, GQLServer])
  class AppImpl {}

  @injectable(() => [Database])
  class DBUsersImpl {}
  @injectable(() => [Database])
  class DBArticlesImpl {}
  @injectable(() => [Database])
  class DBCommentsImpl {}
  @injectable(() => [Database])
  class SessionStoreImpl {}

  @injectable(() => [Request, DBUsers])
  class ProfileImpl {}
  @injectable(() => [Request, SessionStore])
  class SessionImpl {}

  const AppLazy = lazy(() => Promise.resolve(AppImpl));
  const DatabaseConnectionLazy = lazy(() =>
    Promise.resolve(DatabaseConnectionImpl),
  );
  const GQLServerLazy = lazy(() => Promise.resolve(GQLServerImpl));
  const DatabaseLazy = lazy(() => Promise.resolve(DatabaseImpl));
  const SessionStoreLazy = lazy(() => Promise.resolve(SessionStoreImpl));
  const DBUsersLazy = lazy(() => Promise.resolve(DBUsersImpl));
  const DBArticlesLazy = lazy(() => Promise.resolve(DBArticlesImpl));
  const DBCommentsLazy = lazy(() => Promise.resolve(DBCommentsImpl));
  const RequestLazy = lazy(() => Promise.resolve(RequestImpl));
  const ProfileLazy = lazy(() => Promise.resolve(ProfileImpl));
  const SessionLazy = lazy(() => Promise.resolve(SessionImpl));

  return new ServiceContainerBuilder()
    .addSingleton(App, AppLazy)
    .addSingleton(DatabaseConnection, DatabaseConnectionLazy)
    .addSingleton(GQLServer, GQLServerLazy)
    .addTransient(Database, DatabaseLazy)
    .addTransient(SessionStore, SessionStoreLazy)
    .addTransient(DBUsers, DBUsersLazy)
    .addTransient(DBArticles, DBArticlesLazy)
    .addTransient(DBComments, DBCommentsLazy)
    .addScoped(Request, RequestLazy)
    .addScoped(Profile, ProfileLazy)
    .addScoped(Session, SessionLazy);
}
