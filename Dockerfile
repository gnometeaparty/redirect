FROM node:20-alpine AS alpine
RUN apk update
RUN apk add --no-cache libc6-compat

# Install glibc.
# See https://github.com/oven-sh/bun/issues/5545.
RUN apk --no-cache add ca-certificates wget
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub
RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.28-r0/glibc-2.28-r0.apk
RUN apk add --no-cache --force-overwrite glibc-2.28-r0.apk

FROM alpine AS base

# We need PNPM and Turbo to install dependencies, and bun to build and run the server.
RUN npm install pnpm bun turbo --global
RUN pnpm config set store-dir ~/.pnpm-store

FROM base AS builder

WORKDIR /app
COPY . .

# First install the dependencies (as they change less often).
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm i --frozen-lockfile

RUN turbo build
RUN --mount=type=cache,id=pnpm,target=~/.pnpm-store pnpm prune --prod --no-optional
RUN rm -rf ./src

FROM alpine AS runner

RUN addgroup --system --gid 1001 gnometeaparty
RUN adduser --system --uid 1001 gnometeaparty
USER gnometeaparty

WORKDIR /app
COPY --from=builder --chown=user:user /app .

EXPOSE 3000

CMD ["./dist/index.js"]
