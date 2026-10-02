pipeline {
    agent any

    triggers {
        // GitHub webhook triggers the build.
        // Poll SCM remains as a fallback.
        pollSCM('H/2 * * * *')
    }

    environment {
        PORT = '3000'

        // CI-only database
        DB_HOST = 'localhost'
        DB_PORT = '3308'
        DB_USER = 'root'
        DB_PASSWORD = 'ci-root-password'
        DB_NAME = 'worksphere_ci'

        DATABASE_URL = 'mysql://root:ci-root-password@localhost:3308/worksphere_ci'

        FRONTEND_URL = 'http://localhost:5173'

        // CI database container
        CI_DB_CONTAINER = 'worksphere-ci-mariadb'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Install') {
            steps {
                dir('backend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Start CI Database') {
            steps {
                bat '''
                    docker rm -f %CI_DB_CONTAINER% 2>nul || exit /b 0

                    docker run -d ^
                      --name %CI_DB_CONTAINER% ^
                      -e MARIADB_ROOT_PASSWORD=%DB_PASSWORD% ^
                      -e MARIADB_DATABASE=%DB_NAME% ^
                      -p 3308:3306 ^
                      mariadb:10.4

                    echo Waiting for MariaDB...

                    powershell -NoProfile -Command "$ready=$false; for ($i=0; $i -lt 60; $i++) { docker exec %CI_DB_CONTAINER% mariadb-admin ping -h 127.0.0.1 -uroot -p%DB_PASSWORD% --silent 2>$null; if ($LASTEXITCODE -eq 0) { $ready=$true; break }; Start-Sleep -Seconds 2 }; if (-not $ready) { docker logs %CI_DB_CONTAINER%; exit 1 }"

                    echo MariaDB is ready.
                '''
            }
        }

        stage('Backend Migrate') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'worksphere-jwt-secret',
                        variable: 'JWT_SECRET'
                    ),
                    string(
                        credentialsId: 'worksphere-test-admin-email',
                        variable: 'TEST_ADMIN_EMAIL'
                    ),
                    string(
                        credentialsId: 'worksphere-test-admin-password',
                        variable: 'TEST_ADMIN_PASSWORD'
                    ),
                    string(
                        credentialsId: 'worksphere-test-user-email',
                        variable: 'TEST_USER_EMAIL'
                    ),
                    string(
                        credentialsId: 'worksphere-test-user-password',
                        variable: 'TEST_USER_PASSWORD'
                    )
                ]) {
                    dir('backend') {
                        bat 'npx prisma migrate deploy'
                    }
                }
            }
        }

        stage('Backend Seed') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'worksphere-test-admin-email',
                        variable: 'TEST_ADMIN_EMAIL'
                    ),
                    string(
                        credentialsId: 'worksphere-test-admin-password',
                        variable: 'TEST_ADMIN_PASSWORD'
                    ),
                    string(
                        credentialsId: 'worksphere-test-user-email',
                        variable: 'TEST_USER_EMAIL'
                    ),
                    string(
                        credentialsId: 'worksphere-test-user-password',
                        variable: 'TEST_USER_PASSWORD'
                    )
                ]) {
                    dir('backend') {
                        bat 'npm run prisma:seed'
                    }
                }
            }
        }

        stage('Backend Test') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'worksphere-jwt-secret',
                        variable: 'JWT_SECRET'
                    ),
                    string(
                        credentialsId: 'worksphere-test-admin-email',
                        variable: 'TEST_ADMIN_EMAIL'
                    ),
                    string(
                        credentialsId: 'worksphere-test-admin-password',
                        variable: 'TEST_ADMIN_PASSWORD'
                    ),
                    string(
                        credentialsId: 'worksphere-test-user-email',
                        variable: 'TEST_USER_EMAIL'
                    ),
                    string(
                        credentialsId: 'worksphere-test-user-password',
                        variable: 'TEST_USER_PASSWORD'
                    )
                ]) {
                    dir('backend') {
                        bat 'npm test'
                    }
                }
            }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Frontend Install') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    bat 'npm run build'
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                bat 'docker build -t worksphere-backend:ci ./backend'
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                bat 'docker build -t worksphere-frontend:ci ./frontend'
            }
        }

        stage('Deploy Application') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'worksphere-jwt-secret',
                        variable: 'JWT_SECRET'
                    )
                ]) {
                    bat '''
                        echo ========================================
                        echo Deploying WorkSphere application
                        echo ========================================

                        echo.
                        echo Stopping existing WorkSphere containers...
                        docker-compose down

                        echo.
                        echo Starting WorkSphere application...
                        docker-compose up -d

                        echo.
                        echo Current containers:
                        docker-compose ps

                        echo.
                        echo Waiting for frontend to become available...

                        powershell -NoProfile -Command "$ready=$false; for ($i=0; $i -lt 30; $i++) { try { $response=Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { $ready=$true; break } } catch {}; Start-Sleep -Seconds 2 }; if (-not $ready) { echo Frontend health check failed; docker-compose ps; docker-compose logs --tail=100; exit 1 }"

                        echo.
                        echo ========================================
                        echo WorkSphere deployment successful!
                        echo ========================================

                        docker-compose ps
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up CI database...'

            bat '''
                docker rm -f %CI_DB_CONTAINER% 2>nul || exit /b 0
            '''
        }

        success {
            echo '========================================'
            echo 'WorkSphere CI/CD completed successfully.'
            echo 'Application should be available at:'
            echo 'http://localhost:5173'
            echo '========================================'
        }

        failure {
            echo '========================================'
            echo 'WorkSphere CI/CD failed.'
            echo 'Check the failed stage above.'
            echo '========================================'
        }
    }
}