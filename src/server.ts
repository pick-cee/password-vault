import * as readline from 'readline'
import { PasswordVault } from './interfaces/classes'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function promptUser(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer)
        })
    })
}
async function main() {
    let vault: PasswordVault | undefined

    while (true) {
        console.log('What would you like to do?')
        console.log('1. Create a new password vault')
        console.log('2. Sign in to a password vault')
        console.log('3. Add a password to a vault')
        console.log('4. Fetch a password from a vault')
        console.log('Quit (enter q or quit')

        const choice = await promptUser('> ');

        if (choice === 'q' || choice == 'quit') {
            break;
        }
        else if (choice === '1') {
            const vaultName = await promptUser('Please provide a name for the new vault: ')
            const masterPassword = await promptUser('Please enter a master password for thr vault(Do not forget this 😉): ')
            const confirmPassword = await promptUser('Please confirm the master password: ')

            if (masterPassword === confirmPassword) {
                vault = new PasswordVault(vaultName, masterPassword)
                console.log(`New vault created and saved as: ${vaultName}.ccv`)
            }
            else {
                console.log('Passwords do not match. Vault not created')
            }
        }
        else if (choice === '2') {
            const vaultName = await promptUser('Enter vault name: ')
            const masterPassword = await promptUser(`Enter password for the ${vaultName} vault: `)
            vault = PasswordVault.loadVault(vaultName, masterPassword)

            if (vault) {
                console.log('Thank you, you are signed into the vault')
            }
            else {
                console.log('Invalid vault name or password')
            }
        }
        else if (choice === '3') {
            if (!vault) {
                console.log('You must sign in to a vault first.')
                continue;
            }

            const name = await promptUser('Please enter a name for the record: ');
            const username = await promptUser('Please enter a username: ');
            const password = await promptUser('Please enter a password: ');

            vault.addRecord(name, username, password);
            console.log('Password record added successfully.');
        }

        else if (choice === '4') {
            if (!vault) {
                console.log('You must sign in to a vault first.')
                continue;
            }

            const name = await promptUser('Please enter the record name: ')
            const record = vault.getRecord(name)

            if (record) {
                console.log(`For ${record.name}`)
                console.log(`The usernameis:  ${record.username}`)
                console.log(`The password is:  ${record.password}`)
            }
            else {
                console.log(`No record found with name: "${name}".`)
            }
        }
        else {
            console.log('Invalid choice. Please try again')
        }
    }
    rl.close()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})