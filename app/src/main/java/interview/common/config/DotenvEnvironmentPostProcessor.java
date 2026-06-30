package interview.common.config;

import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvBuilder;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

/**
 * DotenvEnvironmentPostProcessor
 *
 * <p>在 Spring Boot 启动最早阶段，根据系统属性 {@code dotenv.file}（默认 {@code .env}）
 * 加载对应的 dotenv 文件，将所有键值以最低优先级注入 Spring {@code Environment}。
 *
 * <p>优先级低于 OS 环境变量，不覆盖 Docker 注入的值。
 *
 * <p>本地开发（{@code ./gradlew bootRun}）：{@code build.gradle} 通过 {@code -Ddotenv.file=.env.dev}
 * 传入文件路径；Docker 生产容器无此系统属性，则静默跳过（文件不存在时同样跳过）。
 *
 * <p>注册路径：{@code META-INF/spring/org.springframework.boot.env.EnvironmentPostProcessor}
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String DOTENV_FILE_PROPERTY = "dotenv.file";
    private static final String DOTENV_PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String dotenvFilePath = System.getProperty(DOTENV_FILE_PROPERTY);
        if (dotenvFilePath == null || dotenvFilePath.isBlank()) {
            // 没有传入 dotenv.file 系统属性（例如在 Docker 容器中），静默跳过
            return;
        }

        // 计算文件的目录和文件名
        File dotenvFile = new File(dotenvFilePath);
        String directory = dotenvFile.getParent();
        String filename = dotenvFile.getName();

        // 如果是相对路径，基于工作目录
        if (directory == null) {
            directory = ".";
        }

        // 检查文件是否存在
        File resolvedFile = new File(directory, filename);
        if (!resolvedFile.exists()) {
            // 文件不存在，静默跳过（开发者可能尚未创建 .env.dev）
            System.out.println("[DotenvEnvironmentPostProcessor] dotenv file not found, skipping: " + resolvedFile.getAbsolutePath());
            return;
        }

        try {
            DotenvBuilder builder = Dotenv.configure()
                    .directory(directory)
                    .filename(filename)
                    .ignoreIfMissing()
                    .ignoreIfMalformed();

            Dotenv dotenv = builder.load();

            Map<String, Object> dotenvMap = new HashMap<>();
            dotenv.entries().forEach(entry -> dotenvMap.put(entry.getKey(), entry.getValue()));

            if (!dotenvMap.isEmpty()) {
                // 使用最低优先级（addLast），不覆盖已有的 OS 环境变量和系统属性
                MapPropertySource propertySource = new MapPropertySource(DOTENV_PROPERTY_SOURCE_NAME, dotenvMap);
                environment.getPropertySources().addLast(propertySource);
                System.out.println("[DotenvEnvironmentPostProcessor] Loaded " + dotenvMap.size()
                        + " properties from: " + resolvedFile.getAbsolutePath());
            }
        } catch (Exception e) {
            System.err.println("[DotenvEnvironmentPostProcessor] Failed to load dotenv file: "
                    + resolvedFile.getAbsolutePath() + " - " + e.getMessage());
        }
    }

    @Override
    public int getOrder() {
        // 在大多数 EnvironmentPostProcessor 之后运行，但仍在 ConfigFileApplicationListener 之前
        return Ordered.LOWEST_PRECEDENCE - 10;
    }
}
