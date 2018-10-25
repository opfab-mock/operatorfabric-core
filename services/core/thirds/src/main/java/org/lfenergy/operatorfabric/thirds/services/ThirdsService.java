/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.lfenergy.operatorfabric.thirds.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.lfenergy.operatorfabric.thirds.model.ResourceTypeEnum;
import org.lfenergy.operatorfabric.thirds.model.Third;
import org.lfenergy.operatorfabric.thirds.model.ThirdData;
import org.lfenergy.operatorfabric.utilities.PathUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ResourceLoaderAware;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;

/**
 * ThirdService for managing Third properties and resources
 */
@Service
@Slf4j
public class ThirdsService implements ResourceLoaderAware {

  private static final String PATH_PREFIX = "file:";
  private static final String CONFIG_FILE_NAME = "config.json";
  private static final String EXTENSION_SEPARATOR = ".";
  @Value("${thirds.storage.path}")
  private String storagePath;
  private ObjectMapper objectMapper;
  private Map<String, Third> defaultCache;
  private Map<String, Map<String, Third>> completeCache;
  private ResourceLoader resourceLoader;

  @Autowired
  public ThirdsService(ObjectMapper objectMapper){
    this.objectMapper = objectMapper;
  }

  /**
   * List all registred thirds
   */
  public List<Third> listThirds() {
    loadCacheIfNeeded();
    return new ArrayList<>(defaultCache.values());
  }

  private synchronized void loadCacheIfNeeded() {
    if (defaultCache == null) {
      loadCache();
    }
  }

  /**
   * Load third data to defaultCache
   */
  private void loadCache() {
    log.info("loading thirds from " + new File(storagePath).getAbsolutePath());
    try {
      Map<String, Map<String, Third>> completeResult = new HashMap<>();
      Resource root = this.resourceLoader.getResource(PATH_PREFIX + storagePath);
      //load default Thirds and recursively loads versionned Thirds
      Map<String, Third> result = loadCache0(root.getFile(),
         Third::getName,
         (f, t) -> completeResult.put(
            t.getName(),
            loadCache0(f, Third::getVersion, null)
         )
      );

      this.defaultCache = result;
      this.completeCache = completeResult;
    } catch (IOException e) {
      log.warn("Unreadable Third config files at  " + storagePath);
    }

  }

  /**
   * Loads a cache for Third resource bundle. Loops over a folder sub folders (depth 1) to find config.json files.
   * These files contain Json serialized {@linkplain ThirdData} objects.
   *
   * @param root
   *    lookup folder
   * @param keyExtractor
   *    key cache extractor from loaded {@linkplain ThirdData}
   * @param onEachActor
   *    do something on each subfolder. Optionnal.
   * @return loaded cache
   */
  private Map<String, Third> loadCache0(File root,
                                        Function<Third, String> keyExtractor,
                                        BiConsumer<File, Third> onEachActor) {
    Map<String, Third> result = new HashMap<>();
    if (root.listFiles() != null)
      Arrays.stream(root.listFiles())
         .filter(File::isDirectory)
         .forEach(f -> {
              File[] configFile = f.listFiles((sf, name) -> name.equals(CONFIG_FILE_NAME));
              if (configFile.length >= 1) {
                try {
                  ThirdData third = objectMapper.readValue(configFile[0], ThirdData.class);
                  result.put(keyExtractor.apply(third), third);
                  if (onEachActor != null)
                    onEachActor.accept(f, third);
                } catch (IOException e) {
                  log.warn("Unreadable Third config file " + f.getAbsolutePath(),e);
                }
              }
            }
         );
    return result;
  }

  /**
   * load resource
   *
   * @param thirdName
   *    Third name
   * @param type
   *    rsource type
   * @param name
   *    resource name
   * @return
   * @throws FileNotFoundException
   */
  public Resource fetchResource(String thirdName, ResourceTypeEnum type, String name) throws
     FileNotFoundException {
    return fetchResource(thirdName, type, null, null, name);
  }

  /**
   * load resource
   *
   * @param thirdName
   *    Third name
   * @param type
   *    resource type
   * @param version
   *    third configuration version
   * @param locale
   *    choosen locale use default if not set
   * @param name
   *    resource name
   * @return
   * @throws FileNotFoundException
   */
  public Resource fetchResource(String thirdName, ResourceTypeEnum type, String version, String locale,
                                String name) throws FileNotFoundException {
    loadCacheIfNeeded();
    Map<String, Third> versions = completeCache.get(thirdName);
    if (versions == null)
      throw new FileNotFoundException("No resource exist for " + thirdName);
    String finalVersion = version != null ? version : this.fetch(thirdName).getVersion();
    Third third = versions.get(finalVersion);
    if (third == null)
      throw new FileNotFoundException("Unknown version (" + finalVersion + ") for " + thirdName);
    String finalLocale = locale != null ? locale : third.getDefaultLocale();
    validateResourceParameters(thirdName, type, name, finalVersion, finalLocale);
    String finalName;
    if (type == ResourceTypeEnum.I18N) {
      finalName = "i18n";
    }else{
      finalName = name;
    }
    String resourcePath = PATH_PREFIX +
       storagePath +
       File.separator +
       thirdName +
       File.separator +
       finalVersion +
       File.separator +
       type.getFolder() +
       File.separator +
       (type.isLocalized() ? (finalLocale + File.separator) : "") +
       finalName + type.getSuffix();
    log.info("loading resource: " + resourcePath);
    return this.resourceLoader.getResource(resourcePath);
  }

  /**
   * Validate resource existence
   *
   * @param thirdName module name
   * @param type resource type
   * @param name resource name
   * @param version module version
   * @param locale resource locale
   * @throws FileNotFoundException when resource does not exist
   */
  private void validateResourceParameters(String thirdName, ResourceTypeEnum type, String name, String version,
                                          String locale) throws FileNotFoundException {
    Third third = completeCache.get(thirdName).get(version);
    switch (type) {
      case CSS:
        if (!third.getCsses().contains(name))
          throw new FileNotFoundException("Unknown css resource for " + thirdName + ":" + version);
        break;
      case MEDIA:
        //remove extension
        int dotIndex = name.lastIndexOf(EXTENSION_SEPARATOR);
        String mediaName;
        if(dotIndex>0)
          mediaName = name.substring(0,dotIndex);
        else
          mediaName = name;
        if (!third.getMedias().containsKey(mediaName) || !third.getLocales().contains(locale))
          throw new FileNotFoundException("Unknown media resource for " + thirdName + "("+locale+"):" + version);
        break;
      case I18N:
        if (!third.getLocales().contains(locale))
          throw new FileNotFoundException("Unknown i18n resource for " + thirdName + ":" + version);
        break;
      case TEMPLATE:
        if (!third.getTemplates().contains(name))
          throw new FileNotFoundException("Unknown i18n resource for " + thirdName + ":" + version);
        break;
      default:
        throw new FileNotFoundException("Unable to find resource for unknown resource type");
    }
  }

  /**
   * fetch {@linkplain Third} for specified name and default version
   *
   * @param name
   * @return
   */
  public Third fetch(String name) {
    loadCacheIfNeeded();
    return fetch(name, null);
  }

  /**
   * load resource
   *
   * @param thirdName
   *    Third name
   * @param type
   *    resource type
   * @param version
   *    third configuration version
   * @param name
   *    resource name
   * @return
   * @throws FileNotFoundException
   */
  public Resource fetchResource(String thirdName, ResourceTypeEnum type, String version, String name) throws
     FileNotFoundException {
    return fetchResource(thirdName, type, version, null, name);
  }

  @Override
  public void setResourceLoader(ResourceLoader resourceLoader) {
    this.resourceLoader = resourceLoader;
  }

  public Third updateThird(InputStream is) throws IOException {
    Path rootPath = Paths.get(this.resourceLoader.getResource(PATH_PREFIX + this.storagePath).getFile().getAbsolutePath()
    ).normalize();
    if(!rootPath.toFile().exists())
      throw new FileNotFoundException("No directory available to unzip bundle");
    Path outPath = rootPath.resolve(UUID.randomUUID().toString());
    try {
      //extract tar.gz
      PathUtils.unTarGz(is, outPath);
      //load config
      return updateThird0(outPath);
    } finally {
      PathUtils.silentDelete(outPath);
    }
  }

  private Third updateThird0(Path outPath) throws IOException {
    // load Third from config
    Path outConfigPath = outPath.resolve(CONFIG_FILE_NAME);
    ThirdData third = objectMapper.readValue(outConfigPath.toFile(), ThirdData.class);
    //third root
    Path existingRootPath = Paths.get(this.resourceLoader.getResource(PATH_PREFIX + this.storagePath).getFile()
       .getAbsolutePath())
       .resolve(third.getName())
       .normalize();
    //third default config
    Path existingConfigPath = existingRootPath.resolve(CONFIG_FILE_NAME);
    //third versionned root
    Path existingVersionPath = existingRootPath.resolve(third.getVersion());
    //move versionned dir
    PathUtils.silentDelete(existingVersionPath);
    PathUtils.moveDir(outPath, existingVersionPath);
    //copy config file to default
    PathUtils.silentDelete(existingConfigPath);
    PathUtils.copy(existingVersionPath.resolve(CONFIG_FILE_NAME), existingConfigPath);

    //update caches
    reloadCache();

    return fetch(third.getName(), third.getVersion());
  }

  /**
   * fetch {@linkplain Third} for specified name and version
   *
   * @param name
   * @param apiVersion
   * @return
   */
  public Third fetch(String name, String apiVersion) {
    loadCacheIfNeeded();
    if (apiVersion == null)
      return this.defaultCache.get(name);
    return this.completeCache.get(name).get(apiVersion);
  }

  public void clear() throws IOException {
    Files.walk(PathUtils.getPath(this.resourceLoader.getResource(PATH_PREFIX + this.storagePath).getFile()), 1)
       .forEach(PathUtils::silentDelete);
    reloadCache();
  }

  private synchronized void reloadCache() {
    loadCache();
  }

}