package com.mycompany.cny.model.cms;

import jakarta.persistence.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "article_tags")
public class ArticleTag {

    @Column(name = "article_id")
    private Integer articleId;

    @Column(name = "tag_name")
    private String tagName;

}
