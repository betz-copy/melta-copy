# Melta Project

A set of microservices and a frontend interface for the **Melta** application. This README will guide you through setting up, running, building, and saving Docker images for the project.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Cloning & Setup](#cloning--setup)
4. [Migrating from an Older Version](#migrating-from-an-older-version)
5. [Running the Project Locally](#running-the-project-locally)
6. [Building the Project](#building-the-project)
7. [Installing Global pnpm Packages](#installing-global-pnpm-packages)
8. [Using pnpm Workspaces](#using-pnpm-workspaces)
9. [Saving Docker Images](#saving-docker-images)
10. [Support](#support)

---

## Introduction

The Melta project is organized into multiple microservices (run via Docker) and a frontend (which can be run locally or also via Docker scripts). This repository uses **pnpm workspaces** for managing and building the various services.

---

## Prerequisites

- **Node.js** (v14 or higher)
- **pnpm** (v8 or higher)
- **Docker** (for running microservices)
- [**Docker Compose**](https://docs.docker.com/compose/) (if not included with your Docker installation)

---

## Cloning & Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/melta-team/melta.git
    ```

    > If you have SSH access, you can use the SSH URL instead:
    >
    > ```bash
    > git clone git@gitlab.com:melta-team/melta.git
    > ```

2. **Navigate to the project directory**

    ```bash
    cd melta
    ```

3. **Add a GitLab personal access token**
    - Go to [GitLab Personal Access Tokens](https://gitlab.com/-/user_settings/personal_access_tokens) and create a token with the necessary scopes.
    - Save it into a file named `npm_token_secret.txt` at the project root:
        ```bash
        echo <your-access-token> > npm_token_secret.txt
        ```
        > **Note:** Keep this token **private** and avoid committing it to source control.

---

## Migrating from an Older Version

If you are **upgrading** from an older version of Melta and have an existing local setup, run:

```bash
pnpm run migrate
```

This script will:

1. Remove all `*-services` folders that are no longer used.
2. Clean old `node_modules` directories.
3. Install new packages.
4. Build all Docker images.
5. Build all packages.
6. Stop any existing frontend/UI instances.
7. Start the UI.

> **Important:** Ensure you have committed or backed up any changes before running this command, as it removes files from previous versions of Melta.

If this is **not** an upgrade scenario, you can skip this step.

---

## Running the Project Locally

### 1. Run all microservices (except the frontend) via Docker

From the project root, run:

```bash
./scripts/run_compose.sh
```

This script will use **Docker Compose** to build and start the microservices defined in `docker-compose.yml` (or similar).

### 2. (Optional) Run the frontend locally

1. Install root-level dependencies (including workspaces):
    ```bash
    pnpm install
    ```
2. Build the packages:
    ```bash
    pnpm run build:packages
    ```
3. Start the frontend:
    ```bash
    pnpm run start-ui
    ```

You can now access the Melta application via `http://localhost` (or a different port if configured).

---

## Building the Project

To build **all** services (including packages) in one go, run:

```bash
pnpm run build
```

Under the hood, this will trigger each service’s build script (defined in its `package.json`).

---

## Installing Global pnpm Packages

If you need a global pnpm package, run:

```bash
pnpm install -g <package-name>
```

> **Note:** Installing packages globally can sometimes cause version conflicts. Use global installs sparingly and consider using local project dependencies or pnpx for one-off usage.

---

## Using pnpm Workspaces

This repository uses [pnpm workspaces](https://pnpm.io/workspaces) to manage multiple services. You can run scripts in a specific workspace by using:

```bash
pnpm run <script-name> -w <workspace-name>
```

For example, to start the frontend service directly:

```bash
pnpm run start -w frontend-service
```

---

## Saving Docker Images

To save Docker images for the project (for backup or transfer):

1. **Build the Docker images** (if not already done):
    ```bash
    docker-compose build
    ```
2. **Save the images to a tar file**:

    ```bash
    docker save -o melta-images.tar <image1> <image2> ...
    ```

    Replace `<image1>`, `<image2>`, etc. with the names of the images you want to include.

3. The file `melta-images.tar` can be transferred to another system. On the target system, load the images with:
    ```bash
    docker load -i melta-images.tar
    ```
