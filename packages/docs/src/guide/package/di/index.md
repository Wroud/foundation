---
outline: deep
---

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

const Logger = createService('Logger')

injectable(() => [])(DatabaseConnection)
injectable(() => [DatabaseConnection])(Database)
injectable(() => [Database])(DBUsers)
injectable(() => [Database])(DBArticles)
injectable(() => [Database])(DBComments)
injectable(() => [Logger, DatabaseConnection, GQLServer])(App)

injectable(() => [])(Request)
injectable(() => [Request, DBUsers])(Profile)
injectable(() => [Request, SessionStore])(Session)
injectable(() => [Database])(SessionStore)
injectable(() => [])(GQLServer)

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
  .addScoped(Session)
</script>

# @wroud/di Guides

Welcome to the @wroud/di library guides! Here you'll find comprehensive documentation and tutorials to help you get started with our dependency injection (DI) library.

<DependenciesGraph width="100%" height="512" :serviceCollection="serviceCollection"/>

## Getting Started

- **[Introduction](getting-started/introduction)**: Learn about the key features and benefits of using @wroud/di in your projects.
- **[Installation](getting-started/installation)**: Step-by-step guide to installing @wroud/di in your environment.
- **[Why DI?](getting-started/why-use-dependency-injection)**: Understand the benefits of DI and when to use it, with practical examples.

## Core Concepts

- **[Service Container](core-concepts/service-container)**: Understand how to register and resolve services using the ServiceContainerBuilder and IServiceProvider.
- **[Service Lifetimes](core-concepts/service-lifetimes)**: Learn about different service lifetimes (singleton, transient, scoped) and how to use them effectively.
- **[Dependency Injection](core-concepts/dependency-injection)**: Dive into the principles of dependency injection and how @wroud/di implements them.

## Advanced Features

- **[Manual Service Registration](advanced-features/manual-service-registration)**: Learn how to manually register services and their dependencies without using decorators.
- **[Factory Services](advanced-features/factory-services)**: Learn how to create and inject factory services for dynamic service creation.
- **[Service Disposal](advanced-features/service-disposal)**: Understand how to manage and dispose of services properly.

## API Reference

- **[API Documentation](/packages/di/api)**: Detailed reference for all classes, methods, and functions provided by @wroud/di.
