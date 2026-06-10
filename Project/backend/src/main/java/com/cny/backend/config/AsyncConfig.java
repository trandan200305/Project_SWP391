package com.cny.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "mailTaskExecutor")
    public Executor mailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);        // 5 active threads initially
        executor.setMaxPoolSize(10);        // 10 threads max
        executor.setQueueCapacity(100);     // queue up to 100 email tasks
        executor.setThreadNamePrefix("MailAsync-");
        // CallerRunsPolicy runs the task on the caller's thread if the queue and pool are full,
        // preventing tasks from being dropped or raising OutOfMemoryErrors.
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
