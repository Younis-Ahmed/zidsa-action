import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import { validateTheme, formatSizeUnits } from './validation.js'
import sdk from './sdk.js'
import logger from './logger.js'

const archive = archiver('zip')

const zip_theme = async (
  build_name: string,
  build_path: string
): Promise<any> => {
  let zipfile_path: string = path.resolve(build_path, `${build_name}.zip`)

  try {
    let valid_theme = await validateTheme(build_path)
    logger.log(valid_theme)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error))
  }

  const output = fs.createWriteStream(zipfile_path)

  output.on('finish', function () {
    if (archive.pointer() >= sdk.MAX_ZIP_FILE_SIZE_50MB) {
      fs.rmSync(zipfile_path)
      logger.warning(`Total size: ${formatSizeUnits(archive.pointer())}`)
      logger.error(`${build_name}.zip has to be less than 50MB`)
    }

    logger.log(`Total size: ${formatSizeUnits(archive.pointer())}`)
    logger.log(`${build_name}.zip successfully created 🎉!\n`)
  })

  archive.pipe(output)

  sdk.root_allowed_files.forEach((file) => {
    let file_path = path.resolve(build_path, file)

    if (fs.existsSync(file_path)) {
      archive.append(fs.createReadStream(file_path), { name: file })
    }
  })

  for (let folder in sdk.structure) {
    let folder_path = path.resolve(build_path, folder)

    if (folder !== 'root' && fs.existsSync(folder_path)) {
      let files = fs.readdirSync(folder_path)

      archive.append('', { name: `${folder}/` })

      files.forEach((file) => {
        let file_path = path.resolve(build_path, folder, file)
        archive.append(fs.createReadStream(file_path), {
          name: `${folder}/${file}`
        })
      })
    }
  }

  await archive.finalize()
}

export default zip_theme
