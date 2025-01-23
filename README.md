# Melta Project

This is a documentation on how to run the Melta project locally, save Docker images, install global npm, and use relevant scripts.

## Prerequisites

-   Node.js (v14 or higher)
-   npm (v6 or higher)
-   Docker (if you want to run the project using Docker)

## Running the Project Locally

We are using docker to run the project microservices. Except the frontend-service

1. Clone the repository:

```bash
git clone https://github.com/melta-team/melta.git
```

2. Navigate to the project directory:

```bash
cd melta
```

3. If migrating from old Melta Project, Run the following command:
    ```bash
        npm run migrate 
    ```
    it will:
    1. remove all *-services folders that are not in shared
    2. clean all ole node_modules
    3. install new shared packages
    4. build all docker images
    5. build all shared code
    6. stop all ui instances
    7. run ui
    
if not, continue to the following steps
4. Add gitlab access token to the project:

    1. Go to [Gitlab Personal access tokens](https://gitlab.com/-/user_settings/personal_access_tokens) And create new token.
    2. Add the token to npm_token_secret.txt file:

    ```bash
    echo <your_access_token> > npm_token_secret.txt
    ```

5. Run the project(all microservices except frontend):

```bash
./scripts/run_compose.sh
```


6. Run frontend service:
    1. Install global npm packges:
    ```bash
    npm install
    ```
    2. Build shared interfaces service:
    ```bash
    npm run build -w services/shared-interfaces
    ```
    3. Build shared service:
    ```bash
    npm run build -w services/shared
    ```
    4. Run frontend service:
    ```bash
    npm run start-ui
    ```

This command will start the frontend service using Docker. You can access the application at `http://localhost`.

## Building the Project

To build the entire project, including all services, run:

```bash
npm run build
```

This command will build all services using the `npm run build` script defined in each service's `package.json` file.

## Installing Global npm

If you need to install a global npm package, you can use the following command:

```bash
npm install -g <package-name>
```

Replace `<package-name>` with the name of the package you want to install globally.

## Using npm Workspaces

This project uses npm workspaces to manage multiple services and packages. You can run scripts for a specific service or package using the following command:

```bash
npm run <script-name> -w <workspace-name>
```

Replace `<script-name>` with the name of the script you want to run, and `<workspace-name>` with the name of the service or package you want to target.

For example, to run the `start` script for the `frontend-service`, you can use:

```bash
npm run start -w services/frontend-service
```

## Saving Docker Images

To save Docker images for the project, follow these steps:

1. Build the Docker images:

```bash
docker-compose build
```

2. Save the Docker images to a tar file:

```bash
docker save -o melta-images.tar <image1> <image2> ...
```

Replace `<image1>`, `<image2>`, etc., with the names of the Docker images you want to save.

3. The `melta-images.tar` file will be created in the current directory, containing the saved Docker images.

You can transfer this file to another machine and load the images using the following command:

```bash
docker load -i melta-images.tar
```

This documentation covers the basic steps to run the Melta project locally, build and clean the project, install global npm packages, use npm workspaces, and save Docker images. For more detailed information and advanced usage, refer to the project's documentation or consult the development team.
