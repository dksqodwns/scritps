#!/usr/bin/env zx

import {exec} from 'child_process';
import util from 'util';
import readline from 'readline';

const execPromise = util.promisify(exec);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
    const rootPassword = await askQuestion('MySQL 루트 비밀번호를 입력해주세요: ');

    const createUserAnswer = await askQuestion('유저를 만드실래요? (y/Enter): ');
    if (createUserAnswer.toLowerCase() !== 'y' && createUserAnswer !== '') {
        console.log('작업을 취소했습니다.');
        rl.close();
        return;
    }

    const username = await askQuestion('유저 이름을 정해주세요: ');
    const password = await askQuestion('비밀번호를 작성해주세요: ');
    const ip = await askQuestion('IP를 작성해주세요 (예: 127.0.0.1): ');

    const ipRegex = /^(localhost|(\d{1,3}\.){1,3}\d{0,3}%?)$/;
    if (!ipRegex.test(ip)) {
        console.log('IP 형식이 올바르지 않습니다.');
        rl.close();
        return;
    }

    const grantAllAnswer = await askQuestion('권한을 모두 부여할까요? (y/Enter): ');

    try {
        const createUserCmd = `CREATE USER '${username}'@'${ip}' IDENTIFIED BY '${password}';`;
        const grantPrivilegesCmd = `GRANT ALL PRIVILEGES ON *.* TO '${username}'@'${ip}' WITH GRANT OPTION;`;
        const flushPrivilegesCmd = `FLUSH PRIVILEGES;`;

        await execPromise(`mysql -u root -p${rootPassword} -e "${createUserCmd}"`);
        if (grantAllAnswer.toLowerCase() === 'y' || grantAllAnswer === '') {
            await execPromise(`mysql -u root -p${rootPassword} -e "${grantPrivilegesCmd}"`);
        }
        await execPromise(`mysql -u root -p${rootPassword} -e "${flushPrivilegesCmd}"`);

        console.log('유저가 성공적으로 생성되었습니다.');
    } catch (error) {
        console.error('유저 생성 중 오류가 발생했습니다:', error);
    } finally {
        rl.close();
    }
}

await createUser();