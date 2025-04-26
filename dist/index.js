import * as core from '@actions/core';
import { warning, error, notice, getInput } from '@actions/core';
import FormData from 'form-data';
import fs from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import archiver from 'archiver';
import { Bumper } from 'conventional-recommended-bump';

const logger = {
    log: (message, properties) => {
        notice(message, properties);
    },
    error: (message, properties) => {
        error(message, properties);
    },
    warning: (message, properties) => {
        warning(message, properties);
    },
};

const homeDir = homedir();
const configDir = path.join(homeDir, '.zid-theme');
const configPath = path.join(configDir, 'config.json');
function getToken() {
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.access_token) {
            return config.access_token;
        }
    }
    logger.log('No session found. Attempting login first.');
    return null;
}
function setToken(token) {
    try {
        // Create directory if it doesn't exist
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        // Write file synchronously to ensure proper return value
        fs.writeFileSync(configPath, JSON.stringify({ access_token: token }));
        return true;
    }
    catch (err) {
        logger.error(`Failed to save token: ${err}`);
        return false;
    }
}

class Api {
    baseUrl = '';
    headers = {};
    route = '';
    method = 'GET';
    body = {};
    token = '';
    params = '';
    key = '';
    constructor() {
        this.token = getToken();
    }
    addBaseUrl(baseUrl) {
        this.baseUrl = baseUrl || 'https://api.zid.sa/v1';
        return this;
    }
    addParams(params) {
        params
            && params.length > 0
            && params?.map(({ key, value }) => (this.params += `${this.params === '' ? '?' : '&'}${key}=${Array.isArray(value) ? value.join(',') : value}`));
        return this;
    }
    addFormData(formData) {
        this.body = formData;
        this.headers['Content-Type'] = 'multipart/form-data';
        return this;
    }
    addKey(key) {
        this.key = this.key ? `${this.key}/${key}` : `/${key}`;
        return this;
    }
    addHeaders(headers) {
        headers.forEach(({ key, value }) => (this.headers[key] = value));
        return this;
    }
    addUserToken() {
        this.headers['x-partner-token'] = `${this.token}`;
        return this;
    }
    addRoute(endpoint) {
        this.route = `${this.baseUrl}${endpoint}`;
        return this;
    }
    addBody(body) {
        this.body = body;
        if (!(body instanceof FormData)) {
            this.headers['Content-Type'] = 'application/json';
        }
        return this;
    }
    post() {
        this.method = 'POST';
        return this;
    }
    get() {
        this.method = 'GET';
        return this;
    }
    put() {
        this.method = 'PUT';
        return this;
    }
    delete() {
        this.method = 'DELETE';
        return this;
    }
    reset() {
        this.baseUrl = '';
        this.headers = {};
        this.route = '';
        this.method = 'GET';
        this.body = {};
        this.params = '';
        this.key = '';
        return this;
    }
    async send() {
        const url = `${this.route}${this.key}${this.params}`;
        const options = {
            method: this.method,
            headers: this.headers,
            body: this.method !== 'GET' ? JSON.stringify(this.body) : undefined,
        };
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status === 401) {
                    logger.error('Token expired, please login again');
                    throw new Error('Token expired, please login again');
                }
                const data = await response.json();
                const message = typeof data === 'object' && data !== null && 'message' in data
                    ? data.message
                    : `Request failed with status ${response.status}`;
                throw new Error(message);
            }
            return (await response.json());
        }
        catch (error) {
            let errorMessage;
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else {
                try {
                    errorMessage = JSON.stringify(error);
                }
                catch {
                    errorMessage = String(error);
                }
            }
            logger.error(`API request failed: ${errorMessage}`);
            throw new Error(errorMessage);
        }
    }
}

async function login(email, password) {
    return new Api()
        .reset()
        .addBaseUrl()
        .addRoute('/market/partner-login')
        .addHeaders([{ key: 'Content-Type', value: 'application/json' }])
        .addBody({
        email,
        password,
    })
        .post()
        .send()
        .then(({ partner }) => {
        if (partner && partner['x-partner-token']) {
            if (!setToken(partner['x-partner-token'])) {
                logger.error('Failed to save token.');
                throw new Error('Failed to save token');
            }
            logger.log('Authentication successful!');
        }
        else {
            logger.error('Authentication failed. Invalid response from server.');
            throw new Error('Invalid response from server');
        }
    })
        .catch((error) => {
        logger.error('Authentication failed');
        throw error;
    });
}

async function getVersionBump(build_path) {
    const bumper = new Bumper(build_path).loadPreset('angular');
    const recommendation = await bumper.bump();
    return recommendation;
}

const structure = {
    root: [
        'query.json',
        'config.json',
        'layout.twig',
        'header.twig',
        'footer.twig',
        'templates',
        'modules',
        'locals',
        'common',
        'assets',
    ],
    templates: [
        '404.twig',
        'account-addresses.twig',
        'account-orders.twig',
        'account-profile.twig',
        'blog.twig',
        'blogs.twig',
        'categories.twig',
        'category.twig',
        'faqs.twig',
        'cart.twig',
        'home.twig',
        'product.twig',
        'products.twig',
        'search.twig',
        'shipping-and-payments.twig',
    ],
    common: ['.twig'],
    modules: ['.twig'],
    assets: [
        '.js',
        '.ts',
        '.css',
        '.scss',
        '.map',
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.svg',
        '.woff',
        '.woff2',
        '.otf',
        '.ttf',
        '.eot',
    ],
    locals: ['.json'],
};
const optional_files = {
    root: ['query.json', 'config.json', 'modules'],
    templates: ['search.twig', 'blogs.twig'],
    common: [],
    modules: [],
    assets: [],
    locals: [],
};
const root_allowed_files = [
    'query.json',
    'config.json',
    'layout.twig',
    'header.twig',
    'footer.twig',
];
const need_structure_validation = ['templates'];
const MAX_ASSETS_FILE_SIZE_2MB = 2 * 1000000;
const MAX_ZIP_FILE_SIZE_50MB = 50 * 1000000;
const sdk = {
    structure,
    optional_files,
    root_allowed_files,
    need_structure_validation,
    MAX_ASSETS_FILE_SIZE_2MB,
    MAX_ZIP_FILE_SIZE_50MB,
};

function validateTheme(build_path) {
    return new Promise((resolve, reject) => {
        const files = fs.readdirSync(build_path);
        const valid_structure = validate_structure('root', files, sdk.structure.root);
        if (valid_structure !== true) {
            // TODO: Add summary for github actions output
            return reject(new Error(`Unable to find:\n   ${valid_structure}\n\n   - Make sure theme path is correct or add required files\n`));
        }
        for (const file of files) {
            const file_data = { path: path.resolve(build_path, file) };
            let stats = null;
            file === '.DS_Store'
                ? delete_ds_store(file_data.path)
                : (stats = fs.lstatSync(file_data.path));
            if (stats && stats.isDirectory() && sdk.structure.root.includes(file)) {
                const subdir_files = fs.readdirSync(file_data.path);
                if (sdk.need_structure_validation.includes(file)) {
                    const valid_structure = validate_structure(file, subdir_files, sdk.structure[file]);
                    if (valid_structure !== true) {
                        return reject(new Error(`Unable to find in templates folder:\n   ${valid_structure}\n\n   - Make sure theme path is correct or add required files\n`));
                    }
                }
                for (const subdir_file of subdir_files) {
                    const subdir_file_path = path.resolve(file_data.path, subdir_file);
                    if (subdir_file === '.DS_Store') {
                        delete_ds_store(subdir_file_path);
                        continue;
                    }
                    if (file === 'assets')
                        validate_assets_file_size(subdir_file, subdir_file_path);
                    if (!sdk.need_structure_validation.includes(file)) {
                        const valid_ext = validate_extension(subdir_file, sdk.structure[file]);
                        if (valid_ext !== true) {
                            return reject(new Error(`Invalid extension ${valid_ext}\n   ${subdir_file} in ${file} folder\n`));
                        }
                    }
                }
            }
        }
        return resolve(`Theme validated`);
    });
}
function validate_structure(file, files, structure) {
    const missed_files = [];
    for (let i = 0; i < structure.length; i++) {
        if (!files.includes(structure[i])
            && !sdk.optional_files[file].includes(structure[i])) {
            missed_files.push(structure[i]);
        }
    }
    if (missed_files.length === 0)
        return true;
    return JSON.stringify(missed_files);
}
function validate_extension(file, base_structure_extnames) {
    const file_ext = path.extname(file);
    if (!base_structure_extnames.includes(file_ext))
        return file_ext;
    return true;
}
function validate_assets_file_size(file, filepath) {
    const stats = fs.lstatSync(filepath);
    if (stats.size >= sdk.MAX_ASSETS_FILE_SIZE_2MB) {
        logger.warning(`WARNING: ${file} in assets is larger than 2MB: ${formatSizeUnits(stats.size)}`);
    }
}
function delete_ds_store(file_path) {
    fs.unlinkSync(file_path);
    logger.warning(`.DS_Store deleted - path: ${file_path}\n\n`);
}
function formatSizeUnits(bytes) {
    if (bytes >= 1073741824)
        return `${(bytes / 1_000_000_000).toFixed(2)}GB`;
    if (bytes >= 1048576)
        return `${(bytes / 1_000_000).toFixed(2)}MB`;
    if (bytes >= 1024)
        return `${(bytes / 1_000).toFixed(2)}KB`;
    if (bytes > 1)
        return `${bytes} bytes`;
    if (bytes === 1)
        return `${bytes} byte`;
    return '0 bytes';
}

const archive = archiver('zip');
async function zip_theme(build_name, build_path) {
    const zipfile_path = path.resolve(build_path, `${build_name}.zip`);
    try {
        const valid_theme = await validateTheme(build_path);
        logger.log(valid_theme);
    }
    catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
    const output = fs.createWriteStream(zipfile_path);
    output.on('finish', () => {
        if (archive.pointer() >= sdk.MAX_ZIP_FILE_SIZE_50MB) {
            fs.rmSync(zipfile_path);
            logger.warning(`Total size: ${formatSizeUnits(archive.pointer())}`);
            logger.error(`${build_name}.zip has to be less than 50MB`);
        }
        logger.log(`Total size: ${formatSizeUnits(archive.pointer())}`);
        logger.log(`${build_name}.zip successfully created 🎉!\n`);
    });
    archive.pipe(output);
    sdk.root_allowed_files.forEach((file) => {
        const file_path = path.resolve(build_path, file);
        if (fs.existsSync(file_path)) {
            archive.append(fs.createReadStream(file_path), { name: file });
        }
    });
    for (const folder in sdk.structure) {
        const folder_path = path.resolve(build_path, folder);
        if (folder !== 'root' && fs.existsSync(folder_path)) {
            const files = fs.readdirSync(folder_path);
            archive.append('', { name: `${folder}/` });
            files.forEach((file) => {
                const file_path = path.resolve(build_path, folder, file);
                archive.append(fs.createReadStream(file_path), {
                    name: `${folder}/${file}`,
                });
            });
        }
    }
    await archive.finalize();
    const bumpRecommendation = await getVersionBump(build_path);
    logger.log(`Version bump recommendation: ${JSON.stringify(bumpRecommendation, null, 2)}`);
    return {
        ...bumpRecommendation,
    };
}

async function updateTheme(theme_id, theme_path) {
    process.chdir(theme_path);
    const { releaseType, reason } = await zip_theme('theme', theme_path);
    const api = new Api();
    const form = new FormData();
    const fileStream = fs.createReadStream(theme_path);
    return new Promise((resolve, reject) => {
        fileStream.on('error', (err) => {
            logger.error('File stream error');
            reject(err); // Reject promise on stream error
        });
        fileStream.on('open', () => {
            form.append('theme_file', fileStream, path.basename(theme_path));
            form.append('change_type', releaseType);
            form.append('release_notes', reason);
            api
                .reset()
                .addBaseUrl()
                .addRoute(`/partners/themes/cli_update/${theme_id}`)
                .addUserToken()
                .addFormData(form)
                .post()
                .send()
                .then(resolve)
                .catch((err) => {
                logger.error('Error during API call');
                reject(err); // Reject promise on API error
            });
        });
    });
}

/**
 * Gets values for the specified GitHub Action input variables
 * @param variables Array of variable keys to retrieve
 * @returns Object containing the requested variables and their values
 */
function getVariables(variables) {
    return variables.reduce((acc, variable) => {
        acc[variable] = getInput(variable);
        return acc;
    }, {});
}
/**
 * Gets the workspace directory path from checkout-out files
 * @returns The path to the workspace directory
 */
function getWorkspacePath() {
    return process.env.GITHUB_WORKSPACE || '.';
}

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
async function run() {
    try {
        const variables = getVariables(['EMAIL', 'PASSWORD', 'THEME_ID']);
        const workspacePath = getWorkspacePath();
        await login(variables.EMAIL, variables.PASSWORD);
        await updateTheme(variables.THEME_ID, workspacePath);
        // Log a success message
        core.info('Theme updated successfully');
        core.setOutput('success', 'true');
    }
    catch (error) {
        // Fail the workflow run if an error occurs
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            // Handle non-Error exceptions too
            core.setFailed(`An unexpected error occurred: ${String(error)}`);
        }
    }
}

/**
 * The entrypoint for the action. This file simply imports and runs the action's
 * main logic.
 */
run();
//# sourceMappingURL=index.js.map
