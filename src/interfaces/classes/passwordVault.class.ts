import { PasswordRecord } from "../passwordRecord.interface";
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path';

export class PasswordVault {
    private records: PasswordRecord[] = []
    private masterPassword: string;
    private vaultName: string;
    private encryptionKey: string

    constructor(
        vaultName: string, masterPassword: string
    ) {
        this.vaultName = vaultName;
        this.masterPassword = masterPassword;
        this.encryptionKey = this.deriveEncryptionKey(masterPassword)
    }

    private deriveEncryptionKey(password: string) {
        const salt = crypto.randomBytes(16).toString('hex')
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512').toString('hex')
        return key
    }

    private encrypt(plainText: string): string {
        const iv = crypto.randomBytes(16) // The Initialization Vector
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv)
        let encrypted = cipher.update(plainText)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    private decrypt(cipherText: string): string {
        const parts = cipherText.split(':')
        const iv = Buffer.from(parts.shift()!, 'hex')
        const encrypted = Buffer.from(parts.join(':'), 'hex')
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv)
        let decrypted = decipher.update(encrypted)
        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString()
    }

    addRecord(name: string, username: string, password: string) {
        const rec: PasswordRecord = {
            name,
            username: this.encrypt(username),
            password: this.encrypt(password)
        }
        this.records.push(rec)
        this.saveVault()
    }

    getRecord(name: string): PasswordRecord | undefined {
        const rec = this.records.find((r) => r.name === name)
        if (rec) {
            return {
                name: rec.name,
                username: this.decrypt(rec.username),
                password: this.decrypt(rec.password)
            }
        }
        return undefined
    }

    saveVault() {
        const data = JSON.stringify(this.records)
        const filePath = path.join(__dirname, `${this.vaultName}.ccv`);
        fs.writeFileSync(filePath, data)
    }

    static loadVault(vaultName: string, masterPassword: string): PasswordVault | undefined {
        try {
            const filePath = path.join(__dirname, `${vaultName}.ccv`);
            const data = fs.readFileSync(filePath, 'utf8');
            const records: PasswordRecord[] = JSON.parse(data)
            const vault = new PasswordVault(vaultName, masterPassword)
            vault.records = records
            return vault
        }
        catch (err) {
            console.error(`Error loading vault ${vaultName}: ${err}`)
            return undefined
        }

    }
}

