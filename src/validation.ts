import fs from 'node:fs'
import path from 'node:path'
import logger from './logger.js'
import sdk from './sdk.js'

export function validateTheme(build_path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(build_path)

    const valid_structure = validate_structure('root', files, sdk.structure.root)
    if (valid_structure !== true) {
      // TODO: Add summary for github actions output
      return reject(
        new Error(`Unable to find:\n   ${valid_structure}\n\n   - Make sure theme path is correct or add required files\n`),
      )
    }

    for (const file of files) {
      const file_data = { filename: file, path: path.resolve(build_path, file) }
      let stats = null
      file === '.DS_Store'
        ? delete_ds_store(file_data.path)
        : (stats = fs.lstatSync(file_data.path))

      if (stats && stats.isDirectory() && sdk.structure.root.includes(file)) {
        const subdir_files = fs.readdirSync(file_data.path)

        if (sdk.need_structure_validation.includes(file)) {
          const valid_structure = validate_structure(
            file,
            subdir_files,
            sdk.structure[file],
          )
          if (valid_structure !== true) {
            return reject(
              new Error(`Unable to find in templates folder:\n   ${valid_structure}\n\n   - Make sure theme path is correct or add required files\n`),
            )
          }
        }

        for (const subdir_file of subdir_files) {
          const subdir_file_path = path.resolve(file_data.path, subdir_file)

          if (subdir_file === '.DS_Store') {
            delete_ds_store(subdir_file_path)
            continue
          }

          if (file === 'assets')
            validate_assets_file_size(subdir_file, subdir_file_path)

          if (!sdk.need_structure_validation.includes(file)) {
            const valid_ext = validate_extension(subdir_file, sdk.structure[file])
            if (valid_ext !== true) {
              return reject(
                new Error(`Invalid extension ${valid_ext}\n   ${subdir_file} in ${file} folder\n`),
              )
            }
          }
        }
      }
    }

    return resolve(`Theme validated`)
  })
}

function validate_structure(file: string, files: string[], structure: string[]): string | boolean {
  const missed_files: string[] = []

  for (let i = 0; i < structure.length; i++) {
    if (
      !files.includes(structure[i])
      && !sdk.optional_files[file].includes(structure[i])
    ) {
      missed_files.push(structure[i])
    }
  }

  if (missed_files.length === 0)
    return true
  return JSON.stringify(missed_files)
}

function validate_extension(file: string, base_structure_extnames: string[]): string | boolean {
  const file_ext = path.extname(file)
  if (!base_structure_extnames.includes(file_ext))
    return file_ext
  return true
}

export function validate_assets_file_size(file: string, filepath: string): void {
  const stats = fs.lstatSync(filepath)
  if (stats.size >= sdk.MAX_ASSETS_FILE_SIZE_2MB) {
    logger.warning(
      `WARNING: ${file} in assets is larger than 2MB: ${formatSizeUnits(stats.size)}`,
    )
  }
}

function delete_ds_store(file_path: string) {
  fs.unlinkSync(file_path)
  logger.warning(`.DS_Store deleted - path: ${file_path}\n\n`)
}

export function formatSizeUnits(bytes: number): string {
  if (bytes >= 1073741824)
    return `${(bytes / 1_000_000_000).toFixed(2)}GB`
  if (bytes >= 1048576)
    return `${(bytes / 1_000_000).toFixed(2)}MB`
  if (bytes >= 1024)
    return `${(bytes / 1_000).toFixed(2)}KB`
  if (bytes > 1)
    return `${bytes} bytes`
  if (bytes === 1)
    return `${bytes} byte`
  return '0 bytes'
}
