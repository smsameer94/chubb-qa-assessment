# Run guide

## Requirements and working directory
Use Docker Desktop with its engine running, roughly 6 GB allocated for this full demo stack, and sufficient host memory (the tested computer has 16 GB). The earlier 2 GB allocation caused a verified Keycloak OOM kill. Node 20+ is needed for local frontend/API test commands; npm.cmd avoids PowerShell script policy issues on Windows.

Run the following setup commands from this repository's root. Paths should refer to this extracted repository, not a different working copy. Default demo credentials are provided by the original application; they are for local use.

## Build a fresh checkout
Generate the ignored frontend API client before building the UI:

```powershell
docker run --rm -v "${PWD}/code:/workspace" openapitools/openapi-generator-cli:v7.14.0 generate -i /workspace/bff-service/src/main/resources/openapi/bff-api.yml -g typescript-fetch -o /workspace/demo-app-ui/src/lib/api/generated --additional-properties=supportsES6=true,typescriptThreePlus=true
```

Build the backend JARs required by their Dockerfiles. These setup builds skip tests; the verification commands below run tests explicitly.

```powershell
docker run --rm -v "${PWD}/code:/workspace" -v "demo-maven-cache:/root/.m2" -w /workspace/claims-service maven:3.9-eclipse-temurin-21 mvn package "-Dmaven.test.skip=true" "-Dcheckstyle.skip=true" "-Dpmd.skip=true"
docker run --rm -v "${PWD}/code:/workspace" -v "demo-maven-cache:/root/.m2" -w /workspace/bff-service maven:3.9-eclipse-temurin-21 mvn package "-Dmaven.test.skip=true" "-Dcheckstyle.skip=true" "-Dpmd.skip=true"
docker compose -f docker-compose.infra.yml up -d
docker compose -f docker-compose.apps.yml up --build -d
```

Both Compose files use the same project and network. Warnings about the other file's orphan containers are expected; do not remove those containers. If a Kafka restart reports a ZooKeeper NodeExists error, allow the stale session to expire and retry startup; do not delete data as the first response.

The applications file supplies the matching Keycloak admin credentials needed for signup. Its supplied CDC flag remains true; CDC infrastructure is optional and is not started or validated by this guide. These API tests do not claim real-time notification coverage. To test direct Kafka mode separately, explicitly select and document that configuration first.

Open http://localhost:3001. Claimant: claimant@demo.com / Claimant123!. Administrator: admin@demo.com / Admin123!.

## Backend unit and selected non-integration suites
Run from the repository root after the initial build. Both selected suites should pass. Integration-tagged Java tests are excluded; these commands do not validate Testcontainers tests. Checkstyle and PMD are skipped explicitly and are not claimed as passed.

```powershell
docker run --rm -v "${PWD}/code:/workspace" -v "demo-maven-cache:/root/.m2" -w /workspace/claims-service maven:3.9-eclipse-temurin-21 mvn clean test "-Dgroups=!integration" "-Dcheckstyle.skip=true" "-Dpmd.skip=true"
docker run --rm -v "${PWD}/code:/workspace" -v "demo-maven-cache:/root/.m2" -w /workspace/bff-service maven:3.9-eclipse-temurin-21 mvn clean test "-Dgroups=!integration" "-Dcheckstyle.skip=true" "-Dpmd.skip=true"
```

Clean removes build outputs including packaged JARs. It does not alter running containers. Repeat the package commands before a later application image rebuild.

## Frontend tests
From code/demo-app-ui:

```powershell
npm.cmd ci
npm.cmd test -- src/features/claims/components/wizard-step-3.behavior.test.tsx
npm.cmd test
```

Three new component tests pass. The full suite currently reports 267 passes and two known theme persistence failures. In restricted Node 24 environments, use the native config loader:

```powershell
npm.cmd test -- --configLoader native
```

Dependencies and generated files are not committed. The UI container holds a snapshot made at image build time, so docker exec demo-ui npm test will not see later host test edits until it is rebuilt. Prefer the local commands above to test the submission source.

## Real service integration
Keep the normal Docker services running. From code/demo-app-ui:

```powershell
npm.cmd run test:integration
```

No additional test dependency is required beyond Node 20+. BFF_URL defaults to http://localhost:8090; ADMIN_EMAIL and ADMIN_PASSWORD can override the demo administrator. The suite uses normal security, real cookies and CSRF headers, creates unique claimants and leaves its accounts/claims in the local database because there is no cleanup API.

Expected current result: 11 tests, 8 passed, 3 failed, no skips. Exit code 1 is expected while the three documented contract defects remain. Do not turn these assertions into expected failures just to obtain a green command. See BUGS.md.

To run the same integration source from a Linux Node container, from repository root:

```powershell
docker run --rm --network demo-network -e BFF_URL=http://bff-service:8090 -v "${PWD}/code/demo-app-ui:/workspace:ro" -w /workspace node:20-alpine node --test --test-concurrency=1 tests/integration/claims-api.integration.mjs
```

The host Node route was executed; this equivalent container command is provided but has not been separately executed.

## Evidence and limits
TEST_STRATEGY.md lists results and exclusions. BUGS.md gives reproductions. AI_JOURNAL.md describes actual AI use. WALKTHROUGH.md prepares the presentation. No remote Git repository has been created or published. The supplied local Git history contains a pristine import and logical subsequent changes, committed after implementation without backdated timestamps.
