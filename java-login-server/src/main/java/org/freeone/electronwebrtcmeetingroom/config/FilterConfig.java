package org.freeone.electronwebrtcmeetingroom.config;

import org.freeone.electronwebrtcmeetingroom.config.filter.CORSFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * @author lqq
 */
@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean corsFilter(){
        FilterRegistrationBean filterRegistrationBean = new FilterRegistrationBean<>();
        filterRegistrationBean.setFilter(new CORSFilter());
        filterRegistrationBean.addUrlPatterns("/*");
        filterRegistrationBean.setName("corsFilter");
        filterRegistrationBean.setOrder(1);
        return filterRegistrationBean;
    }



}
