pipeline {
    agent any

    environment {
        PORT = '3000'

        DB_HOST = 'localhost'
        DB_PORT = '3306'
        DB_USER = 'root'
        DB_NAME = 'worksphere'

        FRONTEND_URL = 'http://localhost:5173'
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

        stage('Backend Test') {
            steps {
                withCredentials([
                    string(credentialsId: 'worksphere-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'worksphere-test-admin-email', variable: 'TEST_ADMIN_EMAIL'),
                    string(credentialsId: 'worksphere-test-admin-password', variable: 'TEST_ADMIN_PASSWORD'),
                    string(credentialsId: 'worksphere-test-user-email', variable: 'TEST_USER_EMAIL'),
                    string(credentialsId: 'worksphere-test-user-password', variable: 'TEST_USER_PASSWORD')
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
    }

    post {
        success {
            echo 'WorkSphere CI completed successfully.'
        }

        failure {
            echo 'WorkSphere CI failed. Check the stage above for details.'
        }
    }
}