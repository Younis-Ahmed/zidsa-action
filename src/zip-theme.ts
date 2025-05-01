import fs from 'node:fs'
import path from 'node:path'
import archiver from 'archiver'
import { getVersionBump } from './getVersionBump.js'
import logger from './logger.js'
import sdk from './sdk.js'
import { formatSizeUnits, validateTheme } from './validation.js'

async function zip_theme(build_name: string, build_path: string): Promise<ReturnType<typeof getVersionBump>> {
  const zipfile_path = path.resolve(build_path, `${build_name}.zip`)

  try {
    const valid_theme = await validateTheme(build_path)
    logger.log(valid_theme)
  }
  catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error))
  }

  // Create a new archive for each call to avoid reusing a closed archive
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level
  })

  // Wrap the zip file creation in a Promise to ensure it completes before continuing
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipfile_path)

    // Handle errors from the archive
    archive.on('error', (err) => {
      logger.error(`Archive error: ${err.message}`)
      reject(err)
    })

    // Handle errors from the output stream
    output.on('error', (err) => {
      logger.error(`Output stream error: ${err.message}`)
      reject(err)
    })

    output.on('close', () => {
      if (archive.pointer() >= sdk.MAX_ZIP_FILE_SIZE_50MB) {
        fs.rmSync(zipfile_path)
        logger.warning(`Total size: ${formatSizeUnits(archive.pointer())}`)
        logger.error(`${build_name}.zip has to be less than 50MB`)
        reject(new Error(`${build_name}.zip has to be less than 50MB`))
      }
      else {
        logger.log(`Total size: ${formatSizeUnits(archive.pointer())}`)
        logger.log(`${build_name}.zip successfully created 🎉!\n`)
        resolve()
      }
    })

    archive.pipe(output)

    // Add root allowed files
    sdk.root_allowed_files.forEach((file) => {
      const file_path = path.resolve(build_path, file)

      if (fs.existsSync(file_path)) {
        archive.append(fs.createReadStream(file_path), { name: file })
      }
    })

    // Add directory structure
    for (const folder in sdk.structure) {
      const folder_path = path.resolve(build_path, folder)

      if (folder !== 'root' && fs.existsSync(folder_path)) {
        const files = fs.readdirSync(folder_path)

        archive.append('', { name: `${folder}/` })

        files.forEach((file) => {
          const file_path = path.resolve(build_path, folder, file)
          archive.append(fs.createReadStream(file_path), {
            name: `${folder}/${file}`,
          })
        })
      }
    }

    // Finalize the archive
    archive.finalize()
  })

  const bumpRecommendation = await getVersionBump(build_path)
  logger.log(`Version bump recommendation: ${JSON.stringify(bumpRecommendation, null, 2)}`)

  return {
    ...bumpRecommendation,
  }
}

export default zip_theme
